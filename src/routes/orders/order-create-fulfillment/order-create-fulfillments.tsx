import { useParams, useSearchParams } from 'react-router-dom';

import { RouteFocusModal } from '../../../components/modals';
import { useOrder } from '../../../hooks/api/orders';
import { useMe } from '../../../hooks/api/users';
import {
  useSellerScopedOrder,
  useSellerShippingOptionIds
} from '../../../hooks/use-seller-scoped-order';
import { OrderCreateFulfillmentForm } from './components/order-create-fulfillment-form';

export function OrderCreateFulfillment() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requiresShipping = searchParams.get('requires_shipping') === 'true';
  const { seller } = useMe();
  const sellerShippingOptionIds = useSellerShippingOptionIds();

  const { order, isLoading, isError, error } = useOrder(id!, {
    fields:
      '*shipping_methods,*items,*items.variant,*items.variant.product.seller,*items.variant.product.shipping_profile'
  });

  const sellerScopedOrder = useSellerScopedOrder(order, seller?.id, sellerShippingOptionIds);

  if (isError) {
    throw error;
  }

  const ready = !isLoading && sellerScopedOrder;

  return (
    <RouteFocusModal>
      {ready && (
        <OrderCreateFulfillmentForm
          order={sellerScopedOrder}
          requiresShipping={requiresShipping}
        />
      )}
    </RouteFocusModal>
  );
}
