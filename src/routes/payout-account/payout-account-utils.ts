import { z } from 'zod';

import {
  type CreateVendorPayoutAccountPayload,
  type UpdateTransferSchedulePayload
} from '../../hooks/api';
import { getDecimalDigits, getStylizedAmount } from '../../lib/money-amount-helpers';

export const THAI_BANK_OPTIONS = [
  { value: 'bbl', label: 'Bangkok Bank (BBL)' },
  { value: 'ktb', label: 'Krung Thai Bank (KTB)' },
  { value: 'bay', label: 'Bank of Ayudhya (Krungsri/BAY)' },
  { value: 'kbank', label: 'Kasikornbank (KBANK)' },
  { value: 'scb', label: 'Siam Commercial Bank (SCB)' },
  { value: 'ttb', label: 'TMBThanachart Bank (TTB)' },
  { value: 'gsb', label: 'Government Savings Bank (GSB)' },
  { value: 'baac', label: 'BAAC' },
  { value: 'uob', label: 'UOB Thailand (UOB)' },
  { value: 'cimb', label: 'CIMB Thai (CIMBT)' },
  { value: 'lhbank', label: 'แลนด์ แอนด์ เฮ้าส์ (LHBANK)' },
  { value: 'tisco', label: 'TISCO Bank (TISCO)' },
  { value: 'kkp', label: 'Kiatnakin Phatra (KKP)' },
  { value: 'icbc', label: 'ICBC (ICBC)' }
] as const;

export const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
] as const;

export const PayoutAccountSchema = z.object({
  name: z.string().trim().min(1, 'Recipient name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  account_type: z.enum(['individual', 'corporation']),
  bank_brand: z.string().trim().min(1, 'Bank code is required'),
  bank_account_number: z
    .string()
    .min(1, 'Bank account number is required')
    .regex(/^\d+$/, 'Bank account number must contain digits only'),
  bank_account_name: z.string().trim().min(1, 'Bank account name is required'),
  tax_id: z.string().regex(/^\d*$/, 'Tax ID must contain digits only').optional()
});

export const TransferScheduleSchema = z
  .object({
    schedule_every: z.string().optional(),
    schedule_period: z.enum(['day', 'week', 'month']).optional(),
    schedule_start_date: z.string().optional(),
    schedule_end_date: z.string().optional(),
    schedule_weekday: z.string().optional(),
    schedule_amount: z.string().optional(),
    schedule_percentage_of_balance: z.string().optional()
  })
  .superRefine((value, ctx) => {
    const every = Number(value.schedule_every || 0);
    if (!Number.isFinite(every) || every <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule every must be greater than 0',
        path: ['schedule_every']
      });
    }

    if (!value.schedule_period) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule period is required',
        path: ['schedule_period']
      });
    }

    if (!value.schedule_start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule start date is required',
        path: ['schedule_start_date']
      });
    }

    if (!value.schedule_end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule end date is required',
        path: ['schedule_end_date']
      });
    }

    if (value.schedule_amount && value.schedule_percentage_of_balance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use either fixed amount or percentage, not both',
        path: ['schedule_percentage_of_balance']
      });
    }
  });

export type PayoutAccountForm = z.infer<typeof PayoutAccountSchema>;
export type TransferScheduleForm = z.infer<typeof TransferScheduleSchema>;

export type PayoutAccountMode = 'create' | 'edit';
export type PayoutAccountPendingAction = 'approve_account' | 'approve_schedule' | 'remove_schedule';

export type PayoutAccountActionCopy = {
  title: string;
  description: string;
  confirmText: string;
};

export const statusColor = (status?: string) => {
  if (status === 'active') return 'green';
  if (status === 'failed' || status === 'disabled') return 'red';
  return 'orange';
};

export const toDisplayAmount = (amountMinor: number, currencyCode: string) => {
  const decimalDigits = getDecimalDigits(currencyCode);
  const amount = amountMinor / 10 ** decimalDigits;
  return getStylizedAmount(amount, currencyCode);
};

export const toTitleCase = (value: string) =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export const buildPayoutAccountPayload = (
  values: PayoutAccountForm
): CreateVendorPayoutAccountPayload => ({
  name: values.name,
  email: values.email || undefined,
  account_type: values.account_type,
  bank_brand: values.bank_brand,
  bank_account_number: values.bank_account_number,
  bank_account_name: values.bank_account_name,
  tax_id: values.tax_id || undefined
});

export const buildTransferSchedulePayload = (
  values: TransferScheduleForm
): UpdateTransferSchedulePayload => {
  const transfer_schedule: CreateVendorPayoutAccountPayload['transfer_schedule'] = {
    enabled: true,
    every: Number(values.schedule_every || '1'),
    period: values.schedule_period || 'month',
    start_date: values.schedule_start_date || '',
    end_date: values.schedule_end_date || '',
    ...(values.schedule_period === 'month' && values.schedule_weekday
      ? {
          on: {
            weekday_of_month: values.schedule_weekday
          }
        }
      : {}),
    ...(values.schedule_amount ? { amount: Number(values.schedule_amount) } : {}),
    ...(values.schedule_percentage_of_balance
      ? { percentage_of_balance: Number(values.schedule_percentage_of_balance) }
      : {})
  };

  return {
    transfer_schedule
  };
};

export const buildDisableTransferSchedulePayload = (): UpdateTransferSchedulePayload => ({
  transfer_schedule: {
    enabled: false
  }
});

export const getPayoutActionCopy = (
  action: PayoutAccountPendingAction,
  mode: PayoutAccountMode
): PayoutAccountActionCopy => {
  if (action === 'remove_schedule') {
    return {
      title: 'Remove transfer schedule?',
      description: 'This disables automatic Omise transfers for this payout account.',
      confirmText: 'Remove schedule'
    };
  }

  if (action === 'approve_schedule') {
    return {
      title: 'Approve transfer schedule?',
      description: 'Review and confirm this transfer schedule before saving it.',
      confirmText: 'Approve schedule'
    };
  }

  return {
    title: mode === 'create' ? 'Approve payout account?' : 'Approve payout account changes?',
    description:
      mode === 'create'
        ? 'Review and confirm this payout account before creating it.'
        : 'Review and confirm these payout account changes before saving them.',
    confirmText: mode === 'create' ? 'Approve and create' : 'Approve and save'
  };
};
