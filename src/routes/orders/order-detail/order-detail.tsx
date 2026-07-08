import { useMemo } from 'react';

import { useLoaderData, useParams } from 'react-router-dom';

import { TwoColumnPageSkeleton } from '../../../components/common/skeleton';
import { TwoColumnPage } from '../../../components/layout/pages';
import { useDashboardExtension } from '../../../extensions';
import { useOrder } from '../../../hooks/api/orders';
import { useMe } from '../../../hooks/api/users';
import {
  useSellerScopedOrder,
  useSellerShippingOptionIds
} from '../../../hooks/use-seller-scoped-order';
import { OrderCustomerSection } from './components/order-customer-section';
import { OrderFulfillmentSection } from './components/order-fulfillment-section';
import { OrderGeneralSection } from './components/order-general-section';
import { OrderPaymentSection } from './components/order-payment-section';
import { OrderSummarySection } from './components/order-summary-section';
import { DEFAULT_FIELDS } from './constants';
import { orderLoader } from './loader';

export const OrderDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof orderLoader>>;

  const { id } = useParams();
  const { getWidgets } = useDashboardExtension();
  const { seller, isLoading: isSellerLoading } = useMe();
  const sellerShippingOptionIds = useSellerShippingOptionIds();

  const { order, isLoading, isError, error } = useOrder(
    id!,
    {
      fields: DEFAULT_FIELDS
    },
    {
      initialData
    }
  );

  const sellerScopedOrder = useSellerScopedOrder(order, seller?.id, sellerShippingOptionIds);

  const sortedSellerScopedOrder = useMemo(() => {
    if (!sellerScopedOrder) {
      return sellerScopedOrder;
    }

    return {
      ...sellerScopedOrder,
      items: [...sellerScopedOrder.items].sort((itemA, itemB) => {
        if (itemA.created_at > itemB.created_at) {
          return 1;
        }

        if (itemA.created_at < itemB.created_at) {
          return -1;
        }

        return 0;
      })
    };
  }, [sellerScopedOrder]);

  if (isLoading || isSellerLoading || !order || sortedSellerScopedOrder === undefined) {
    return (
      <TwoColumnPageSkeleton
        mainSections={4}
        sidebarSections={2}
        showJSON
      />
    );
  }

  if (isError) {
    throw error;
  }

  if (sortedSellerScopedOrder === null) {
    throw new Response('Order not found', { status: 404 });
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets('order.details.after'),
        before: getWidgets('order.details.before'),
        sideAfter: getWidgets('order.details.side.after'),
        sideBefore: getWidgets('order.details.side.before')
      }}
      data={sortedSellerScopedOrder}
      hasOutlet
    >
      <TwoColumnPage.Main>
        <OrderGeneralSection order={sortedSellerScopedOrder} />
        <OrderSummarySection order={sortedSellerScopedOrder} />
        <OrderPaymentSection order={sortedSellerScopedOrder} />
        <OrderFulfillmentSection order={sortedSellerScopedOrder} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <OrderCustomerSection order={sortedSellerScopedOrder} />
        {/* TODO: Uncomment when API returns data about payment cancel/capture/refund dates + when section is adapted to the changes */}
        {/* <OrderActivitySection order={order} /> */}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
