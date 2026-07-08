import { useParams } from 'react-router-dom';

import { RouteFocusModal } from '../../../components/modals';
import { useOrder } from '../../../hooks/api/orders';
import { useMe } from '../../../hooks/api/users';
import {
  useSellerScopedOrder,
  useSellerShippingOptionIds
} from '../../../hooks/use-seller-scoped-order';
import { OrderAllocateItemsForm } from './components/order-create-fulfillment-form';

export function OrderAllocateItems() {
  const { id } = useParams();
  const { seller } = useMe();
  const sellerShippingOptionIds = useSellerShippingOptionIds();

  const { order, isLoading, isError, error } = useOrder(id!, {
    fields:
      'currency_code,*shipping_methods,*items,*items.variant,*items.variant.product,*items.variant.product.seller,+items.variant.product.title,*items.variant.inventory,*items.variant.inventory.location_levels,*items.variant.inventory_items,*shipping_address'
  });

  const sellerScopedOrder = useSellerScopedOrder(order, seller?.id, sellerShippingOptionIds);

  if (isError) {
    throw error;
  }

  const ready = !isLoading && sellerScopedOrder;

  return (
    <RouteFocusModal>
      {ready && <OrderAllocateItemsForm order={sellerScopedOrder} />}
    </RouteFocusModal>
  );
}
