import { Fragment } from 'react';

import { Badge, Button, Container, FocusModal, Heading, Input, Select, Text } from '@medusajs/ui';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Form } from '../../components/common/form';
import { KeyboundForm } from '../../components/utilities/keybound-form';
import type {
  VendorPayoutAccount,
  VendorPayoutSummary,
  VendorPayoutTransaction
} from '../../hooks/api';
import {
  statusColor,
  THAI_BANK_OPTIONS,
  toDisplayAmount,
  toTitleCase,
  WEEKDAY_OPTIONS,
  type PayoutAccountForm,
  type PayoutAccountMode,
  type TransferScheduleForm
} from './payout-account-utils';

type PayoutAccountHeaderProps = {
  payoutAccount?: VendorPayoutAccount | null;
  isPending: boolean;
};

export const PayoutAccountHeader = ({ payoutAccount, isPending }: PayoutAccountHeaderProps) => {
  const { t } = useTranslation();
  return (
    <Container className="flex items-center justify-between gap-x-4 p-6">
      <div>
        <Heading>{t('payoutAccount.header.title')}</Heading>
        <Text
          size="small"
          className="text-ui-fg-subtle"
        >
          {t('payoutAccount.header.description')}
        </Text>
      </div>
      <Badge color={statusColor(payoutAccount?.status) as any}>
        {isPending
          ? t('payoutAccount.header.loading')
          : payoutAccount?.status || t('payoutAccount.header.notConnected')}
      </Badge>
    </Container>
  );
};

type PayoutSummaryCardsProps = {
  summaries: VendorPayoutSummary[];
};

export const PayoutSummaryCards = ({ summaries }: PayoutSummaryCardsProps) => {
  const { t } = useTranslation();
  return (
    <div className="mb-8 grid grid-cols-1 gap-3">
      {summaries.map(summary => (
        <div
          key={summary.currency_code}
          className="rounded-lg border border-ui-border-base p-4"
        >
          <Text
            size="small"
            weight="plus"
            className="mb-3 uppercase text-ui-fg-subtle"
          >
            {summary.currency_code}
          </Text>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <PayoutSummaryMetric
              label={t('payoutAccount.balance.sellerSold')}
              amount={summary.amount_sold_minor ?? 0}
              currencyCode={summary.currency_code}
            />
            <PayoutSummaryMetric
              label={t('payoutAccount.balance.pending')}
              amount={summary.amount_pending_minor ?? 0}
              currencyCode={summary.currency_code}
            />
            <PayoutSummaryMetric
              label={t('payoutAccount.balance.paid')}
              amount={summary.amount_paid_minor ?? 0}
              currencyCode={summary.currency_code}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

type PayoutSummaryMetricProps = {
  label: string;
  amount: number;
  currencyCode: string;
};

const PayoutSummaryMetric = ({ label, amount, currencyCode }: PayoutSummaryMetricProps) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-ui-border-base p-3">
      <Text
        size="xsmall"
        className="mb-1 text-ui-fg-subtle"
      >
        {t('payoutAccount.balance.status')}
      </Text>
      <Text
        size="small"
        weight="plus"
      >
        {label}
      </Text>
      <Text size="small">{toDisplayAmount(amount, currencyCode)}</Text>
    </div>
  );
};

type PayoutTransactionsTableProps = {
  transactions: VendorPayoutTransaction[] | null;
  expandedTransactionId: string | null;
  onToggleExpandedTransaction: (transactionId: string) => void;
};

export const PayoutTransactionsTable = ({
  transactions,
  expandedTransactionId,
  onToggleExpandedTransaction
}: PayoutTransactionsTableProps) => {
  const { t } = useTranslation();
  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-ui-border-base">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
              {[
                t('payoutAccount.transactions.columns.date'),
                t('payoutAccount.transactions.columns.amount'),
                t('payoutAccount.transactions.columns.status'),
                t('payoutAccount.transactions.columns.transactionId'),
                t('payoutAccount.transactions.columns.detail')
              ].map((label, i) => (
                <th
                  key={label}
                  className={`px-4 py-3 text-left ${i === 4 ? 'text-right' : ''}`}
                >
                  <Text
                    size="small"
                    weight="plus"
                  >
                    {label}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions?.length ? (
              transactions.map(transaction => {
                const isExpanded = expandedTransactionId === transaction.transfer_id;

                return (
                  <Fragment key={transaction.transfer_id}>
                    <tr className="border-b border-ui-border-base align-top last:border-b-0">
                      <td className="px-4 py-3">
                        <Text size="small">
                          {new Date(transaction.created_at).toLocaleString()}
                        </Text>
                      </td>
                      <td className="px-4 py-3">
                        <Text size="small">
                          {toDisplayAmount(transaction.amount_minor, transaction.currency_code)}
                        </Text>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColor(transaction.status) as any}>
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Text
                          size="small"
                          className="max-w-[260px] truncate"
                        >
                          {transaction.omise_transfer_id || transaction.transfer_id}
                        </Text>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={() => onToggleExpandedTransaction(transaction.transfer_id)}
                        >
                          {isExpanded
                            ? t('payoutAccount.transactions.actions.hide')
                            : t('payoutAccount.transactions.actions.view')}
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-ui-bg-subtle/40 border-b border-ui-border-base last:border-b-0">
                        <td
                          colSpan={5}
                          className="px-4 py-3"
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <Text size="small">
                              {t('payoutAccount.transactions.expanded.transferId')}{' '}
                              {transaction.transfer_id}
                            </Text>
                            <Text size="small">
                              {t('payoutAccount.transactions.expanded.updatedAt')}{' '}
                              {new Date(transaction.updated_at).toLocaleString()}
                            </Text>
                            {transaction.failure_reason && (
                              <Text
                                size="small"
                                className="text-ui-fg-error md:col-span-2"
                              >
                                {t('payoutAccount.transactions.expanded.reason')}{' '}
                                {transaction.failure_reason}
                              </Text>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center"
                >
                  <Text
                    size="small"
                    className="text-ui-fg-muted"
                  >
                    {t('payoutAccount.transactions.noData')}
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

type ManualPayoutActionBarProps = {
  isRunning: boolean;
  disabled?: boolean;
  onRunPayout: () => void;
};

export const ManualPayoutActionBar = ({
  isRunning,
  disabled,
  onRunPayout
}: ManualPayoutActionBarProps) => {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <Heading level="h2">{t('payoutAccount.transactions.title')}</Heading>
        <Text
          size="small"
          className="text-ui-fg-subtle"
        >
          {t('payoutAccount.transactions.description')}
        </Text>
      </div>
      <Button
        type="button"
        variant="secondary"
        isLoading={isRunning}
        disabled={disabled}
        onClick={onRunPayout}
      >
        {t('payoutAccount.transactions.runPayout')}
      </Button>
    </div>
  );
};

type PayoutAccountDetailsProps = {
  payoutAccount?: VendorPayoutAccount | null;
};

export const PayoutAccountDetails = ({ payoutAccount }: PayoutAccountDetailsProps) => {
  const { t } = useTranslation();

  if (!payoutAccount) {
    return null;
  }

  const bankOption = THAI_BANK_OPTIONS.find(bank => bank.value === payoutAccount.bank_brand);
  const bankLabel = bankOption?.label || payoutAccount.bank_brand || '-';
  const bankCode = payoutAccount.bank_brand?.toUpperCase() || '';
  const maskedAccount = payoutAccount.bank_last4 ? `•••• •••• ${payoutAccount.bank_last4}` : '—';

  return (
    <div className="mb-6">
      <Heading
        level="h2"
        className="mb-4"
      >
        {t('payoutAccount.bankAccount.title')}
      </Heading>
      <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base shadow-sm">
        <div className="flex items-center gap-4 border-b border-ui-border-base bg-ui-bg-subtle px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-base">
            <Text
              size="xsmall"
              weight="plus"
              className="font-mono text-ui-fg-base"
            >
              {bankCode.slice(0, 4)}
            </Text>
          </div>
          <div className="min-w-0 flex-1">
            <Text
              size="small"
              weight="plus"
            >
              {bankLabel}
            </Text>
            <Text
              size="xsmall"
              className="text-ui-fg-subtle"
            >
              {payoutAccount.account_type === 'corporation'
                ? t('payoutAccount.bankAccount.corporateAccount')
                : t('payoutAccount.bankAccount.individualAccount')}
            </Text>
          </div>
          <Badge color={statusColor(payoutAccount.status) as any}>{payoutAccount.status}</Badge>
        </div>

        <div className="grid grid-cols-1 divide-y divide-ui-border-base md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="px-5 py-4">
            <Text
              size="xsmall"
              weight="plus"
              className="mb-1 text-ui-fg-subtle"
            >
              {t('payoutAccount.bankAccount.accountName')}
            </Text>
            <Text size="small">{payoutAccount.account_name || '—'}</Text>
          </div>
          <div className="px-5 py-4">
            <Text
              size="xsmall"
              weight="plus"
              className="mb-1 text-ui-fg-subtle"
            >
              {t('payoutAccount.bankAccount.accountNumber')}
            </Text>
            <Text
              size="small"
              className="font-mono tracking-widest"
            >
              {maskedAccount}
            </Text>
          </div>
          <div className="px-5 py-4">
            <Text
              size="xsmall"
              weight="plus"
              className="mb-1 text-ui-fg-subtle"
            >
              {t('payoutAccount.bankAccount.omiseRecipientId')}
            </Text>
            <Text
              size="small"
              className="truncate font-mono text-ui-fg-subtle"
            >
              {payoutAccount.omise_recipient_id || '—'}
            </Text>
          </div>
        </div>

        {payoutAccount.failure_reason && (
          <div className="border-t border-ui-border-base bg-ui-bg-subtle-hover px-5 py-3">
            <Text
              size="small"
              className="text-ui-fg-error"
            >
              {payoutAccount.failure_reason}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

type PayoutAccountFormCardProps = {
  form: UseFormReturn<PayoutAccountForm>;
  mode: PayoutAccountMode;
  isSaving: boolean;
  isDirty: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export const PayoutAccountFormCard = ({
  form,
  mode,
  isSaving,
  isDirty,
  open,
  onOpenChange,
  onSubmit
}: PayoutAccountFormCardProps) => {
  const { t } = useTranslation();
  return (
    <FocusModal
      open={open}
      onOpenChange={onOpenChange}
    >
      <FocusModal.Trigger asChild>
        <Button
          type="button"
          variant={mode === 'create' ? 'primary' : 'secondary'}
        >
          {mode === 'create'
            ? t('payoutAccount.form.createButton')
            : t('payoutAccount.form.editButton')}
        </Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header />
        <Form {...form}>
          <KeyboundForm
            onSubmit={onSubmit}
            className="flex size-full flex-col overflow-hidden"
          >
            <FocusModal.Body className="flex flex-col overflow-auto p-8">
              <div className="mb-6">
                <FocusModal.Title className="txt-compact-xlarge-plus text-ui-fg-base">
                  {mode === 'create'
                    ? t('payoutAccount.form.modalTitleCreate')
                    : t('payoutAccount.form.modalTitleEdit')}
                </FocusModal.Title>
                <FocusModal.Description className="txt-compact-small text-ui-fg-subtle">
                  {t('payoutAccount.form.modalDescription')}
                </FocusModal.Description>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.recipientName')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={t('payoutAccount.form.fields.recipientNamePlaceholder')}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.email')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={t('payoutAccount.form.fields.emailPlaceholder')}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="account_type"
                  control={form.control}
                  render={({ field: { ref, onChange, ...field } }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.accountType')}</Form.Label>
                      <Form.Control>
                        <Select
                          {...field}
                          onValueChange={onChange}
                        >
                          <Select.Trigger ref={ref}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="individual">
                              {t('payoutAccount.form.fields.individual')}
                            </Select.Item>
                            <Select.Item value="corporation">
                              {t('payoutAccount.form.fields.corporation')}
                            </Select.Item>
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="tax_id"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.taxId')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder={t('payoutAccount.form.fields.taxIdPlaceholder')}
                          onChange={event => {
                            field.onChange(event.target.value.replace(/\D/g, ''));
                          }}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="bank_brand"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.bankCode')}</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value
                              placeholder={t('payoutAccount.form.fields.bankCodePlaceholder')}
                            />
                          </Select.Trigger>
                          <Select.Content>
                            {THAI_BANK_OPTIONS.map(bank => (
                              <Select.Item
                                key={bank.value}
                                value={bank.value}
                              >
                                {bank.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="bank_account_name"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.bankAccountName')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={t('payoutAccount.form.fields.bankAccountNamePlaceholder')}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="bank_account_number"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.form.fields.bankAccountNumber')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          autoComplete="off"
                          inputMode="numeric"
                          placeholder={t('payoutAccount.form.fields.bankAccountNumberPlaceholder')}
                          onChange={event => {
                            field.onChange(event.target.value.replace(/\D/g, ''));
                          }}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button
                    type="button"
                    variant="secondary"
                  >
                    {t('payoutAccount.form.footer.cancel')}
                  </Button>
                </FocusModal.Close>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={!isDirty && mode === 'edit'}
                >
                  {mode === 'create'
                    ? t('payoutAccount.form.footer.submitCreate')
                    : t('payoutAccount.form.footer.submitEdit')}
                </Button>
              </div>
            </FocusModal.Footer>
          </KeyboundForm>
        </Form>
      </FocusModal.Content>
    </FocusModal>
  );
};

type TransferScheduleFormCardProps = {
  form: UseFormReturn<TransferScheduleForm>;
  transferSchedule?: NonNullable<VendorPayoutAccount['provider_data']>['transfer_schedule'];
  hasTransferSchedule: boolean;
  isSaving: boolean;
  isDirty: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onSubmit: () => void;
  onRemove: () => void;
};

export const TransferScheduleFormCard = ({
  form,
  transferSchedule,
  hasTransferSchedule,
  isSaving,
  isDirty,
  open,
  onOpenChange,
  disabled,
  onSubmit,
  onRemove
}: TransferScheduleFormCardProps) => {
  const { t } = useTranslation();
  return (
    <FocusModal
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="mb-8">
        <Heading level="h2">{t('payoutAccount.transferSchedule.title')}</Heading>
        <Text
          size="small"
          className="text-ui-fg-subtle"
        >
          {t('payoutAccount.transferSchedule.description')}
        </Text>
        <CurrentScheduleSummary transferSchedule={transferSchedule} />
        <div className="mt-4">
          <FocusModal.Trigger asChild>
            <Button
              type="button"
              variant={hasTransferSchedule ? 'secondary' : 'primary'}
              disabled={disabled}
            >
              {hasTransferSchedule
                ? t('payoutAccount.transferSchedule.editButton')
                : t('payoutAccount.transferSchedule.addButton')}
            </Button>
          </FocusModal.Trigger>
          {disabled && (
            <Text
              size="small"
              className="mt-2 text-ui-fg-subtle"
            >
              {t('payoutAccount.transferSchedule.disabledHint')}
            </Text>
          )}
        </div>
      </div>
      <FocusModal.Content>
        <FocusModal.Header />
        <Form {...form}>
          <KeyboundForm
            onSubmit={onSubmit}
            className="flex size-full flex-col overflow-hidden"
          >
            <FocusModal.Body className="flex flex-col overflow-auto p-8">
              <div className="mb-6">
                <FocusModal.Title className="txt-compact-xlarge-plus text-ui-fg-base">
                  {hasTransferSchedule
                    ? t('payoutAccount.transferSchedule.modalTitleEdit')
                    : t('payoutAccount.transferSchedule.modalTitleAdd')}
                </FocusModal.Title>
                <FocusModal.Description className="txt-compact-small text-ui-fg-subtle">
                  {t('payoutAccount.transferSchedule.modalDescription')}
                </FocusModal.Description>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  name="schedule_every"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.transferSchedule.fields.every')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="1"
                          onChange={event => {
                            field.onChange(event.target.value.replace(/\D/g, ''));
                          }}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="schedule_period"
                  control={form.control}
                  render={({ field: { ref, onChange, ...field } }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.transferSchedule.fields.period')}</Form.Label>
                      <Form.Control>
                        <Select
                          {...field}
                          onValueChange={onChange}
                        >
                          <Select.Trigger ref={ref}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="day">
                              {t('payoutAccount.transferSchedule.fields.day')}
                            </Select.Item>
                            <Select.Item value="week">
                              {t('payoutAccount.transferSchedule.fields.week')}
                            </Select.Item>
                            <Select.Item value="month">
                              {t('payoutAccount.transferSchedule.fields.month')}
                            </Select.Item>
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="schedule_start_date"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t('payoutAccount.transferSchedule.fields.startDate')}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="date"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="schedule_end_date"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t('payoutAccount.transferSchedule.fields.endDate')}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="date"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                {form.watch('schedule_period') === 'month' && (
                  <Form.Field
                    name="schedule_weekday"
                    control={form.control}
                    render={({ field: { ref, onChange, ...field } }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('payoutAccount.transferSchedule.fields.monthRule')}
                        </Form.Label>
                        <Form.Control>
                          <Select
                            {...field}
                            onValueChange={onChange}
                          >
                            <Select.Trigger ref={ref}>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              {['1st', '2nd', '3rd', '4th'].flatMap(rank =>
                                WEEKDAY_OPTIONS.map(weekday => (
                                  <Select.Item
                                    key={`${rank}_${weekday.value}`}
                                    value={`${rank}_${weekday.value}`}
                                  >
                                    {rank} {weekday.label}
                                  </Select.Item>
                                ))
                              )}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                )}
                <Form.Field
                  name="schedule_amount"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t('payoutAccount.transferSchedule.fields.fixedAmountLabel')}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder={t(
                            'payoutAccount.transferSchedule.fields.fixedAmountPlaceholder'
                          )}
                          onChange={event => {
                            field.onChange(event.target.value.replace(/\D/g, ''));
                          }}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="schedule_percentage_of_balance"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t('payoutAccount.transferSchedule.fields.percentageLabel')}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          inputMode="decimal"
                          placeholder={t(
                            'payoutAccount.transferSchedule.fields.percentagePlaceholder'
                          )}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <div className="flex items-center justify-end gap-2">
                <FocusModal.Close asChild>
                  <Button
                    type="button"
                    variant="secondary"
                  >
                    {t('payoutAccount.transferSchedule.footer.cancel')}
                  </Button>
                </FocusModal.Close>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!hasTransferSchedule}
                  isLoading={isSaving}
                  onClick={onRemove}
                >
                  {t('payoutAccount.transferSchedule.footer.removeSchedule')}
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={!isDirty && hasTransferSchedule}
                >
                  {t('payoutAccount.transferSchedule.footer.approve')}
                </Button>
              </div>
            </FocusModal.Footer>
          </KeyboundForm>
        </Form>
      </FocusModal.Content>
    </FocusModal>
  );
};

type CurrentScheduleSummaryProps = {
  transferSchedule?: NonNullable<VendorPayoutAccount['provider_data']>['transfer_schedule'];
};

const CurrentScheduleSummary = ({ transferSchedule }: CurrentScheduleSummaryProps) => {
  const { t } = useTranslation();
  const currentSchedulePeriod =
    transferSchedule?.period && transferSchedule?.every
      ? `${t('payoutAccount.transferSchedule.fields.every')} ${transferSchedule.every} ${transferSchedule.period}${transferSchedule.every > 1 ? 's' : ''}`
      : null;
  const currentScheduleDateRange =
    transferSchedule?.start_date && transferSchedule?.end_date
      ? `${transferSchedule.start_date} to ${transferSchedule.end_date}`
      : null;
  const currentScheduleRule = transferSchedule?.on?.weekday_of_month
    ? transferSchedule.on.weekday_of_month
        .split('_')
        .map(part => toTitleCase(part))
        .join(' ')
    : null;
  const currentScheduleTransfer =
    transferSchedule?.transfer?.amount != null
      ? `${t('payoutAccount.transferSchedule.fixedAmount')}: ${transferSchedule.transfer.amount}`
      : transferSchedule?.transfer?.percentage_of_balance != null
        ? `${t('payoutAccount.transferSchedule.percentageOfBalance')}: ${transferSchedule.transfer.percentage_of_balance}%`
        : t('payoutAccount.transferSchedule.fullBalance');

  return (
    <div className="mt-3 rounded-md border border-ui-border-base p-3">
      <Text
        size="small"
        weight="plus"
      >
        {t('payoutAccount.transferSchedule.currentSchedule')}
      </Text>
      {transferSchedule ? (
        <div className="mt-1 grid gap-1 text-ui-fg-subtle">
          {currentSchedulePeriod && <Text size="small">{currentSchedulePeriod}</Text>}
          {currentScheduleDateRange && <Text size="small">{currentScheduleDateRange}</Text>}
          {currentScheduleRule && (
            <Text size="small">
              {t('payoutAccount.transferSchedule.rule')}: {currentScheduleRule}
            </Text>
          )}
          <Text size="small">{currentScheduleTransfer}</Text>
        </div>
      ) : (
        <Text
          size="small"
          className="mt-1 text-ui-fg-subtle"
        >
          {t('payoutAccount.transferSchedule.noSchedule')}
        </Text>
      )}
    </div>
  );
};
