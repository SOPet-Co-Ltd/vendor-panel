import { useMemo } from 'react';

import { sliceOrderForSeller, sliceOrdersForSeller } from '../lib/order-slicer';
import { ExtendedAdminOrder } from '../types/order';
import { useShippingOptions } from './api/shipping-options';

export function useSellerShippingOptionIds() {
  const { shipping_options = [] } = useShippingOptions(
    { limit: 200 },
    { staleTime: 5 * 60 * 1000 }
  );

  return useMemo(
    () => new Set(shipping_options.map(option => option.id).filter(Boolean)),
    [shipping_options]
  );
}

export function useSellerScopedOrder(
  order: ExtendedAdminOrder | undefined,
  sellerId: string | undefined,
  sellerShippingOptionIds: Set<string>
) {
  return useMemo(() => {
    if (!order || !sellerId) {
      return undefined;
    }

    return sliceOrderForSeller(order, sellerId, sellerShippingOptionIds);
  }, [order, sellerId, sellerShippingOptionIds]);
}

export function useSellerScopedOrders(
  orders: ExtendedAdminOrder[] | undefined,
  sellerId: string | undefined,
  sellerShippingOptionIds: Set<string>
) {
  return useMemo(() => {
    if (!orders || !sellerId) {
      return orders;
    }

    return sliceOrdersForSeller(orders, sellerId, sellerShippingOptionIds);
  }, [orders, sellerId, sellerShippingOptionIds]);
}
