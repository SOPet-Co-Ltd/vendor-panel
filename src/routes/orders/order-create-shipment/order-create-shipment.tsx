import { useParams } from 'react-router-dom';

import { RouteFocusModal } from '../../../components/modals';
import { useOrder } from '../../../hooks/api/orders';
import { useMe } from '../../../hooks/api/users';
import {
  useSellerScopedOrder,
  useSellerShippingOptionIds
} from '../../../hooks/use-seller-scoped-order';
import { OrderCreateShipmentForm } from './components/order-create-shipment-form';

export function OrderCreateShipment() {
  const { id, f_id } = useParams();
  const { seller } = useMe();
  const sellerShippingOptionIds = useSellerShippingOptionIds();

  const { order, isLoading, isError, error } = useOrder(id!, {
    fields:
      '*shipping_methods,*fulfillments,*fulfillments.items,*fulfillments.labels,*items,*items.variant,*items.variant.product,*items.variant.product.seller'
  });

  const sellerScopedOrder = useSellerScopedOrder(order, seller?.id, sellerShippingOptionIds);

  if (isError) {
    throw error;
  }

  const ready = !isLoading && sellerScopedOrder;

  const fulfillment = sellerScopedOrder?.fulfillments?.find(f => f.id === f_id);

  return (
    <RouteFocusModal>
      {ready && fulfillment && (
        <OrderCreateShipmentForm
          order={sellerScopedOrder}
          fulfillment={fulfillment}
        />
      )}
    </RouteFocusModal>
  );
}
