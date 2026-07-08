import { AdminOrderLineItem, HttpTypes } from '@medusajs/types';

import { ExtendedAdminOrder } from '../types/order';

function getNumericAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object' && 'value' in value) {
    const rawVal = (value as { value?: string | number }).value;
    if (typeof rawVal === 'string' || typeof rawVal === 'number') {
      const parsed = Number(rawVal);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }

  return 0;
}

function scaleAmount(value: unknown, share: number): number {
  return Math.round(getNumericAmount(value) * share * 100) / 100;
}

function getItemSubtotal(item: AdminOrderLineItem): number {
  const quantity = getNumericAmount(item.quantity);
  const unitPrice = getNumericAmount(item.unit_price);
  const multiplied = unitPrice * quantity;

  if (multiplied > 0) {
    return multiplied;
  }

  return getNumericAmount(item.subtotal ?? item.total);
}

function getShippingMethodAmount(
  method: NonNullable<ExtendedAdminOrder['shipping_methods']>[number]
): number {
  return getNumericAmount(method.total ?? method.amount ?? method.subtotal);
}

function getAdjustmentTotal(adjustments?: Array<{ amount?: unknown } | null> | null): number {
  return (adjustments ?? []).reduce(
    (total, adjustment) => total + getNumericAmount(adjustment?.amount),
    0
  );
}

export function getOrderLineItemSellerId(item: AdminOrderLineItem): string | undefined {
  const product = item.variant?.product as { seller?: { id?: string } } | undefined;

  return product?.seller?.id;
}

function getFulfillmentItemIds(item: {
  line_item_id?: string | null;
  item_id?: string | null;
  id?: string;
  item?: { line_item_id?: string | null; item_id?: string | null; id?: string };
}): string[] {
  const directIds = [item.line_item_id, item.item_id, item.id];
  const nestedIds = [item.item?.line_item_id, item.item?.item_id, item.item?.id];

  return [...directIds, ...nestedIds].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
}

function fulfillmentContainsAnyItem(
  fulfillment: NonNullable<ExtendedAdminOrder['fulfillments']>[number],
  itemIds: Set<string>
): boolean {
  return (fulfillment.items ?? []).some(fulfillmentItem =>
    getFulfillmentItemIds(fulfillmentItem).some(id => itemIds.has(id))
  );
}

function getShippingMethodsForSeller(
  order: ExtendedAdminOrder,
  sellerId: string,
  sellerShippingOptionIds?: Set<string>
) {
  return (order.shipping_methods ?? []).filter(method => {
    const methodSellerId = (method as { seller_id?: string | null }).seller_id;

    if (methodSellerId === sellerId) {
      return true;
    }

    return (
      typeof method.shipping_option_id === 'string' &&
      sellerShippingOptionIds?.has(method.shipping_option_id)
    );
  });
}

function computeSliceAmounts(
  order: ExtendedAdminOrder,
  items: AdminOrderLineItem[],
  allItems: AdminOrderLineItem[],
  sellerId: string,
  sellerShippingOptionIds?: Set<string>
) {
  const orderItemSubtotal = allItems.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  const sliceItemSubtotal = items.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  const share = orderItemSubtotal > 0 ? sliceItemSubtotal / orderItemSubtotal : 0;
  const matchedShippingMethods = getShippingMethodsForSeller(
    order,
    sellerId,
    sellerShippingOptionIds
  );
  const exactSliceShipping = matchedShippingMethods.reduce(
    (total, method) => total + getShippingMethodAmount(method),
    0
  );
  const exactItemDiscount = items.reduce(
    (total, item) => total + getAdjustmentTotal(item.adjustments),
    0
  );
  const exactShippingDiscount = matchedShippingMethods.reduce(
    (total, method) => total + getAdjustmentTotal(method.adjustments),
    0
  );
  const sliceShipping =
    matchedShippingMethods.length > 0
      ? exactSliceShipping
      : scaleAmount(order.shipping_total, share);
  const sliceDiscount =
    matchedShippingMethods.length > 0
      ? exactItemDiscount + exactShippingDiscount
      : scaleAmount(order.discount_total, share);
  const automaticTaxesOn = !!order.region?.automatic_taxes;
  const sliceTax = items.reduce((total, item) => {
    return (
      total +
      (item.tax_lines ?? []).reduce((itemTax, line) => itemTax + getNumericAmount(line.total), 0)
    );
  }, 0);
  const sliceShippingTax = matchedShippingMethods.reduce((total, method) => {
    return (
      total +
      (method.tax_lines ?? []).reduce(
        (methodTax, line) => methodTax + getNumericAmount(line.total),
        0
      )
    );
  }, 0);
  const taxTotal =
    matchedShippingMethods.length > 0
      ? sliceTax + sliceShippingTax
      : scaleAmount(order.tax_total, share);
  const itemTotal = automaticTaxesOn
    ? sliceItemSubtotal
    : scaleAmount(order.item_total, share) || sliceItemSubtotal;
  const shippingSubtotal =
    matchedShippingMethods.length > 0
      ? matchedShippingMethods.reduce(
          (total, method) => total + getNumericAmount(method.subtotal ?? method.amount),
          0
        )
      : scaleAmount(order.shipping_subtotal, share);
  const shippingTotal = sliceShipping;
  const discountSubtotal = scaleAmount(order.discount_subtotal, share);
  const total = itemTotal + shippingTotal + taxTotal - sliceDiscount;

  return {
    share,
    matchedShippingMethods,
    itemTotal,
    shippingSubtotal,
    shippingTotal,
    shippingTaxTotal: sliceShippingTax,
    discountTotal: sliceDiscount,
    discountSubtotal,
    taxTotal,
    total
  };
}

export function sliceOrderForSeller(
  order: ExtendedAdminOrder,
  sellerId: string,
  sellerShippingOptionIds?: Set<string>
): ExtendedAdminOrder | null {
  const allItems = order.items ?? [];
  const items = allItems.filter(item => getOrderLineItemSellerId(item) === sellerId);

  if (items.length === 0) {
    return null;
  }

  const itemIds = new Set(items.map(item => item.id));
  const amounts = computeSliceAmounts(order, items, allItems, sellerId, sellerShippingOptionIds);
  const { share, matchedShippingMethods } = amounts;

  const splitOrderPayment = order.split_order_payment
    ? {
        ...order.split_order_payment,
        authorized_amount: amounts.total,
        captured_amount: scaleAmount(order.split_order_payment.captured_amount, share),
        refunded_amount: scaleAmount(order.split_order_payment.refunded_amount, share)
      }
    : order.split_order_payment;

  const paymentCollections = order.payment_collections?.map(collection => ({
    ...collection,
    amount: scaleAmount(collection.amount, share),
    authorized_amount: scaleAmount(collection.authorized_amount, share),
    captured_amount: scaleAmount(collection.captured_amount, share),
    refunded_amount: scaleAmount(collection.refunded_amount, share)
  }));

  return {
    ...order,
    items,
    shipping_methods:
      matchedShippingMethods.length > 0 ? matchedShippingMethods : order.shipping_methods,
    fulfillments: (order.fulfillments ?? []).filter(fulfillment =>
      fulfillmentContainsAnyItem(fulfillment, itemIds)
    ),
    item_total: amounts.itemTotal,
    subtotal: amounts.itemTotal,
    shipping_total: amounts.shippingTotal,
    shipping_subtotal: amounts.shippingSubtotal,
    shipping_tax_total: amounts.shippingTaxTotal,
    discount_total: amounts.discountTotal,
    discount_subtotal: amounts.discountSubtotal,
    tax_total: amounts.taxTotal,
    total: amounts.total,
    refundable_total: scaleAmount(order.refundable_total, share),
    split_order_payment: splitOrderPayment,
    payment_collections: paymentCollections as HttpTypes.AdminPaymentCollection[] | undefined
  };
}

export function sliceOrdersForSeller(
  orders: ExtendedAdminOrder[],
  sellerId: string,
  sellerShippingOptionIds?: Set<string>
): ExtendedAdminOrder[] {
  return orders
    .map(order => sliceOrderForSeller(order, sellerId, sellerShippingOptionIds))
    .filter((order): order is ExtendedAdminOrder => order !== null);
}
