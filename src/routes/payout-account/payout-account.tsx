import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Heading, Text, toast, usePrompt } from '@medusajs/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  useCreatePayoutAccount,
  useMe,
  usePayoutAccount,
  useRunVendorPayouts,
  useUpdateTransferSchedule
} from '../../hooks/api';
import {
  ManualPayoutActionBar,
  PayoutAccountDetails,
  PayoutAccountFormCard,
  PayoutAccountHeader,
  PayoutSummaryCards,
  PayoutTransactionsTable,
  TransferScheduleFormCard
} from './payout-account-components';
import {
  buildDisableTransferSchedulePayload,
  buildPayoutAccountPayload,
  buildTransferSchedulePayload,
  PayoutAccountSchema,
  TransferScheduleSchema,
  type PayoutAccountForm,
  type PayoutAccountMode,
  type PayoutAccountPendingAction,
  type TransferScheduleForm
} from './payout-account-utils';

export const PayoutAccount = () => {
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PayoutAccountPendingAction | null>(null);
  const [isPayoutAccountModalOpen, setIsPayoutAccountModalOpen] = useState(false);
  const [isTransferScheduleModalOpen, setIsTransferScheduleModalOpen] = useState(false);
  const prompt = usePrompt();
  const { t } = useTranslation();
  const { seller } = useMe();
  const {
    payout_account,
    payout_summary = [],
    payout_transactions = [],
    isPending,
    isError,
    error
  } = usePayoutAccount();
  const { mutateAsync: mutatePayoutAccountAsync, isPending: isSavingPayoutAccount } =
    useCreatePayoutAccount();
  const { mutateAsync: mutateTransferScheduleAsync, isPending: isSavingTransferSchedule } =
    useUpdateTransferSchedule();
  const { mutateAsync: runVendorPayoutsAsync, isPending: isRunningManualPayout } =
    useRunVendorPayouts();

  const mode: PayoutAccountMode = payout_account ? 'edit' : 'create';
  const isAccountPending = payout_account?.status === 'pending';
  const transferSchedule = payout_account?.provider_data?.transfer_schedule;
  const hasTransferSchedule = Boolean(transferSchedule && !transferSchedule.deleted);

  const accountDefaults = useMemo<PayoutAccountForm>(
    () => ({
      name: seller?.name || '',
      email: seller?.email || '',
      account_type: payout_account?.account_type || 'individual',
      bank_brand: payout_account?.bank_brand || '',
      bank_account_number: '',
      bank_account_name: payout_account?.account_name || '',
      tax_id: seller?.tax_id || ''
    }),
    [
      payout_account?.account_name,
      payout_account?.account_type,
      payout_account?.bank_brand,
      seller?.email,
      seller?.name,
      seller?.tax_id
    ]
  );

  const scheduleDefaults = useMemo<TransferScheduleForm>(
    () => ({
      schedule_every: transferSchedule?.every ? String(transferSchedule.every) : '1',
      schedule_period: transferSchedule?.period || 'month',
      schedule_start_date: transferSchedule?.start_date || '',
      schedule_end_date: transferSchedule?.end_date || '',
      schedule_weekday: transferSchedule?.on?.weekday_of_month || '1st_monday',
      schedule_amount:
        transferSchedule?.transfer?.amount != null ? String(transferSchedule.transfer.amount) : '',
      schedule_percentage_of_balance:
        transferSchedule?.transfer?.percentage_of_balance != null
          ? String(transferSchedule.transfer.percentage_of_balance)
          : ''
    }),
    [
      transferSchedule?.end_date,
      transferSchedule?.every,
      transferSchedule?.on?.weekday_of_month,
      transferSchedule?.period,
      transferSchedule?.start_date,
      transferSchedule?.transfer?.amount,
      transferSchedule?.transfer?.percentage_of_balance
    ]
  );

  const form = useForm<PayoutAccountForm>({
    defaultValues: accountDefaults,
    resolver: zodResolver(PayoutAccountSchema)
  });

  const scheduleForm = useForm<TransferScheduleForm>({
    defaultValues: scheduleDefaults,
    resolver: zodResolver(TransferScheduleSchema)
  });

  useEffect(() => {
    form.reset(accountDefaults);
  }, [accountDefaults, form]);

  useEffect(() => {
    scheduleForm.reset(scheduleDefaults);
  }, [scheduleDefaults, scheduleForm]);

  if (isError) {
    throw error;
  }

  const approveAction = async (action: PayoutAccountPendingAction) => {
    setPendingAction(action);

    let title: string;
    let description: string;
    let confirmText: string;

    if (action === 'remove_schedule') {
      title = t('payoutAccount.transferSchedule.confirm.removeTitle');
      description = t('payoutAccount.transferSchedule.confirm.removeDescription');
      confirmText = t('payoutAccount.transferSchedule.confirm.removeConfirm');
    } else if (action === 'approve_schedule') {
      title = t('payoutAccount.transferSchedule.confirm.approveScheduleTitle');
      description = t('payoutAccount.transferSchedule.confirm.approveScheduleDescription');
      confirmText = t('payoutAccount.transferSchedule.confirm.approveScheduleConfirm');
    } else {
      title =
        mode === 'create'
          ? t('payoutAccount.transferSchedule.confirm.approveAccountTitleCreate')
          : t('payoutAccount.transferSchedule.confirm.approveAccountTitleEdit');
      description =
        mode === 'create'
          ? t('payoutAccount.transferSchedule.confirm.approveAccountDescriptionCreate')
          : t('payoutAccount.transferSchedule.confirm.approveAccountDescriptionEdit');
      confirmText =
        mode === 'create'
          ? t('payoutAccount.transferSchedule.confirm.approveAccountConfirmCreate')
          : t('payoutAccount.transferSchedule.confirm.approveAccountConfirmEdit');
    }

    const approved = await prompt({
      title,
      description,
      confirmText,
      cancelText: t('payoutAccount.transferSchedule.confirm.cancel')
    });

    setPendingAction(null);
    return approved;
  };

  const handlePayoutAccountSubmit = form.handleSubmit(async values => {
    const approved = await approveAction('approve_account');
    if (!approved) {
      return;
    }

    await mutatePayoutAccountAsync(buildPayoutAccountPayload(values), {
      onSuccess: () => {
        form.reset({
          ...values,
          bank_account_number: ''
        });
        setIsPayoutAccountModalOpen(false);
        toast.success(t('payoutAccount.form.toast.success'));
      },
      onError: error => {
        toast.error(error.message);
      }
    });
  });

  const handleTransferScheduleSubmit = scheduleForm.handleSubmit(async values => {
    const approved = await approveAction('approve_schedule');
    if (!approved) {
      return;
    }

    await mutateTransferScheduleAsync(buildTransferSchedulePayload(values), {
      onSuccess: () => {
        setIsTransferScheduleModalOpen(false);
        toast.success(t('payoutAccount.form.toast.scheduleSuccess'));
      },
      onError: error => {
        toast.error(error.message);
      }
    });
  });

  const handleRemoveTransferSchedule = async () => {
    const approved = await approveAction('remove_schedule');
    if (!approved) {
      return;
    }

    await mutateTransferScheduleAsync(buildDisableTransferSchedulePayload(), {
      onSuccess: () => {
        setIsTransferScheduleModalOpen(false);
        toast.success(t('payoutAccount.form.toast.scheduleRemoved'));
      },
      onError: error => {
        toast.error(error.message);
      }
    });
  };

  const payoutSummaryDisplay =
    payout_summary.length > 0
      ? payout_summary
      : [
          {
            currency_code: 'THB',
            amount_sold_minor: 0,
            amount_pending_minor: 0,
            amount_paid_minor: 0
          }
        ];

  const payoutTransactionsDisplay = payout_transactions.length > 0 ? payout_transactions : null;

  const handleManualPayout = async () => {
    await runVendorPayoutsAsync(undefined, {
      onSuccess: response => {
        const created = response?.result?.created ?? 0;
        const skipped = response?.result?.skipped ?? 0;
        const failed = response?.result?.failed ?? 0;
        toast.success(
          t('payoutAccount.form.toast.manualPayoutSuccess', { created, skipped, failed })
        );
      },
      onError: error => {
        toast.error(error.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-y-3">
      <PayoutAccountHeader
        payoutAccount={payout_account}
        isPending={isPending}
      />

      <Container className="p-6">
        <div className="mb-6">
          <Heading level="h2">{t('payoutAccount.balance.title')}</Heading>
          <Text
            size="small"
            className="text-ui-fg-subtle"
          >
            {t('payoutAccount.balance.description')}
          </Text>
        </div>
        <PayoutSummaryCards summaries={payoutSummaryDisplay} />

        <ManualPayoutActionBar
          isRunning={isRunningManualPayout}
          disabled={isAccountPending}
          onRunPayout={handleManualPayout}
        />
        <PayoutTransactionsTable
          transactions={payoutTransactionsDisplay}
          expandedTransactionId={expandedTransactionId}
          onToggleExpandedTransaction={transactionId =>
            setExpandedTransactionId(current => (current === transactionId ? null : transactionId))
          }
        />

        <PayoutAccountDetails payoutAccount={payout_account} />

        <PayoutAccountFormCard
          form={form}
          mode={mode}
          isSaving={isSavingPayoutAccount || pendingAction === 'approve_account'}
          isDirty={form.formState.isDirty}
          open={isPayoutAccountModalOpen}
          onOpenChange={setIsPayoutAccountModalOpen}
          onSubmit={handlePayoutAccountSubmit}
        />

        <div className="my-8 border-t border-ui-border-base" />

        <TransferScheduleFormCard
          form={scheduleForm}
          transferSchedule={transferSchedule}
          hasTransferSchedule={hasTransferSchedule}
          isSaving={isSavingTransferSchedule || pendingAction === 'approve_schedule'}
          isDirty={scheduleForm.formState.isDirty}
          open={isTransferScheduleModalOpen}
          onOpenChange={setIsTransferScheduleModalOpen}
          disabled={!payout_account || isAccountPending}
          onSubmit={handleTransferScheduleSubmit}
          onRemove={handleRemoveTransferSchedule}
        />
      </Container>
    </div>
  );
};
