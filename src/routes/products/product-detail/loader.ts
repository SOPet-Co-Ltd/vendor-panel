import { LoaderFunctionArgs } from 'react-router-dom';

import { productsQueryKeys } from '../../../hooks/api/products';
import { fetchQuery } from '../../../lib/client';
import { queryClient } from '../../../lib/query-client';
import productsImagesFormatter from '../../../utils/products-images-formatter';
import { FULL_PRODUCT_DETAIL_FIELDS } from './constants';

const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, {
    fields: FULL_PRODUCT_DETAIL_FIELDS
  }),
  queryFn: async () => {
    const [productRes, tagsRes] = await Promise.all([
      fetchQuery(`/vendor/products/${id}`, {
        method: 'GET',
        query: { fields: FULL_PRODUCT_DETAIL_FIELDS }
      }),
      fetchQuery(`/vendor/products/${id}/custom-tags`, {
        method: 'GET'
      }).catch(() => null)
    ]);

    const product = (productRes as any)?.product ?? productRes;
    if (tagsRes && (tagsRes as any).custom_tags) {
      product.custom_tags = (tagsRes as any).custom_tags;
    }

    const formatted = productsImagesFormatter(product);
    return {
      ...(typeof productRes === 'object' && productRes !== null ? productRes : {}),
      product: formatted
    };
  }
});

export const productLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = productDetailQuery(id!);

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000
  });

  return response;
};
