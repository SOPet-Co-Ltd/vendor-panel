import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import { backendUrl, publishableApiKey } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { productsQueryKeys } from './products';

type PublishResponse = { message?: string; published_to_algolia?: boolean };
type UnpublishResponse = { message?: string; published_to_algolia?: boolean };
type ErrorBody = { error?: string; errors?: string[] };

async function fetchWithErrorBody(url: string, method: 'POST', body?: object): Promise<unknown> {
  const bearer =
    (typeof window !== 'undefined' && window.localStorage.getItem('medusa_auth_token')) || '';
  const res = await fetch(`${backendUrl}${url}`, {
    method,
    headers: {
      authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
      'x-publishable-api-key': publishableApiKey
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ErrorBody;
    const message = err.error || (err as { message?: string }).message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

/**
 * Publish product to Algolia (search). Backend validates and returns 400 with
 * { error, errors? } if product is incomplete.
 */
export const usePublishProductToAlgolia = (
  productId: string,
  options?: UseMutationOptions<PublishResponse, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchWithErrorBody(
        `/vendor/products/${productId}/publish-to-algolia`,
        'POST'
      ) as Promise<PublishResponse>,
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId)
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists()
      });
      options?.onSuccess?.(_data, _variables, context);
    },
    ...options
  });
};

/**
 * Unpublish product from Algolia (remove from search).
 */
export const useUnpublishProductFromAlgolia = (
  productId: string,
  options?: UseMutationOptions<UnpublishResponse, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchWithErrorBody(
        `/vendor/products/${productId}/unpublish-from-algolia`,
        'POST'
      ) as Promise<UnpublishResponse>,
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId)
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists()
      });
      options?.onSuccess?.(_data, _variables, context);
    },
    ...options
  });
};
