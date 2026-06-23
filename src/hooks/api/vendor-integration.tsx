import { FetchError } from '@medusajs/js-sdk';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions
} from '@tanstack/react-query';

import { backendUrl, fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';

const VENDOR_INTEGRATION_QUERY_KEY = 'vendor_integration' as const;
export const vendorIntegrationQueryKeys = queryKeysFactory(VENDOR_INTEGRATION_QUERY_KEY);

export type VendorIntegrationSecretResponse = {
  has_key: boolean;
  prefix: string | null;
  created_at: string | null;
};

export type VendorIntegrationRegenerateResponse = {
  secret: string;
  prefix: string;
  created_at: string;
};

export const useIntegrationSecret = (
  options?: Omit<
    UseQueryOptions<
      VendorIntegrationSecretResponse,
      FetchError,
      VendorIntegrationSecretResponse,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery('/vendor/integration/secret', {
        method: 'GET'
      }),
    queryKey: vendorIntegrationQueryKeys.details(),
    ...options
  });

  return { ...data, ...rest };
};

export const useRegenerateIntegrationSecret = (
  options?: UseMutationOptions<VendorIntegrationRegenerateResponse, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery('/vendor/integration/secret/regenerate', {
        method: 'POST'
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: vendorIntegrationQueryKeys.details()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const getIntegrationProductsEndpoint = (sellerId: string) => {
  const base = backendUrl.replace(/\/$/, '');
  return `${base}/integrations/vendors/${sellerId}/products`;
};
