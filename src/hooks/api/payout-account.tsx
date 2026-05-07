import { FetchError } from '@medusajs/js-sdk';
import {
  MutationOptions,
  QueryKey,
  useMutation,
  useQuery,
  UseQueryOptions
} from '@tanstack/react-query';

import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';

const PAYOUT_ACCOUNT_QUERY_KEY = 'payout-account' as const;
export const payoutAccountQueryKeys = queryKeysFactory(PAYOUT_ACCOUNT_QUERY_KEY);

export type VendorPayoutAccount = {
  id: string;
  seller_id: string;
  omise_recipient_id?: string | null;
  status: 'pending' | 'active' | 'failed' | 'disabled';
  account_type: 'individual' | 'corporation';
  account_name?: string | null;
  bank_brand?: string | null;
  bank_last4?: string | null;
  failure_reason?: string | null;
  activated_at?: string | null;
  provider_data?: {
    transfer_schedule?: {
      id?: string;
      status?: string;
      active?: boolean;
      deleted?: boolean;
      every?: number;
      period?: 'day' | 'week' | 'month';
      start_date?: string;
      end_date?: string;
      on?: {
        weekdays?: string[];
        days_of_month?: number[];
        weekday_of_month?: string;
      } | null;
      transfer?: {
        amount?: number;
        percentage_of_balance?: number;
      };
    } | null;
  } | null;
};

export type VendorPayoutAccountResponse = {
  payout_account: VendorPayoutAccount | null;
  payout_summary: VendorPayoutSummary[];
  payout_transactions: VendorPayoutTransaction[];
};

export type VendorPayoutAccountMutationResponse = {
  payout_account: VendorPayoutAccount;
};

export type VendorPayoutSummary = {
  currency_code: string;
  amount_sold_minor: number;
  amount_pending_minor: number;
  amount_paid_minor: number;
};

export type VendorPayoutTransaction = {
  transfer_id: string;
  omise_transfer_id?: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  amount_minor: number;
  currency_code: string;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type RunVendorPayoutsPayload = {
  currency_code?: string;
};

export type RunVendorPayoutsResponse = {
  result: {
    created: number;
    skipped: number;
    failed: number;
    transfers: unknown[];
  };
};

export type CreateVendorPayoutAccountPayload = {
  name: string;
  email?: string;
  account_type: 'individual' | 'corporation';
  bank_brand: string;
  bank_account_number: string;
  bank_account_name: string;
  tax_id?: string;
  transfer_schedule?:
    | {
        enabled: false;
      }
    | {
        enabled?: true;
        every: number;
        period: 'day' | 'week' | 'month';
        start_date: string;
        end_date: string;
        on?: {
          weekdays?: string[];
          days_of_month?: number[];
          weekday_of_month?: string;
        };
        amount?: number;
        percentage_of_balance?: number;
      };
};

export async function retrievePayoutAccount(): Promise<VendorPayoutAccountResponse> {
  return await fetchQuery('/vendor/payout-account', {
    method: 'GET'
  });
}

export const usePayoutAccount = (
  options?: Omit<
    UseQueryOptions<VendorPayoutAccountResponse, FetchError, VendorPayoutAccountResponse, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => retrievePayoutAccount(),
    queryKey: payoutAccountQueryKeys.details(),
    ...options
  });

  return {
    ...data,
    ...rest
  };
};

export const useCreatePayoutAccount = (
  options?: MutationOptions<
    VendorPayoutAccountMutationResponse,
    FetchError,
    CreateVendorPayoutAccountPayload
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery('/vendor/payout-account/upsert', {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: payoutAccountQueryKeys.details()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export type UpdateTransferSchedulePayload = {
  transfer_schedule: NonNullable<CreateVendorPayoutAccountPayload['transfer_schedule']>;
};

export const useUpdateTransferSchedule = (
  options?: MutationOptions<
    VendorPayoutAccountMutationResponse,
    FetchError,
    UpdateTransferSchedulePayload
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery('/vendor/payout-account/transfer-schedule', {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: payoutAccountQueryKeys.details()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useRunVendorPayouts = (
  options?: MutationOptions<
    RunVendorPayoutsResponse,
    FetchError,
    RunVendorPayoutsPayload | undefined
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery('/vendor/payouts/run', {
        method: 'POST',
        body: payload ?? {}
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: payoutAccountQueryKeys.details()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
