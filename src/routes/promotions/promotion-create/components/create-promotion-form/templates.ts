const commonHiddenFields = ['type', 'application_method.type', 'application_method.allocation'];

const shippingDiscountHiddenFields = ['type', 'application_method.allocation'];

export const templates = [
  {
    id: 'percentage_off_product',
    type: 'standard',
    title: 'Percentage off product',
    description: 'Discounts a percentage off selected products',
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: 'false',
      type: 'standard',
      application_method: {
        allocation: 'each',
        target_type: 'items',
        type: 'percentage'
      }
    }
  },
  {
    id: 'buy_get',
    type: 'buy_get',
    title: 'Buy X Get Y',
    description: 'Buy X product(s), get Y product(s)',
    hiddenFields: [...commonHiddenFields, 'application_method.value'],
    defaults: {
      is_automatic: 'false',
      type: 'buyget',
      application_method: {
        type: 'percentage',
        value: 100,
        apply_to_quantity: 1,
        max_quantity: 1
      }
    }
  },
  {
    id: 'shipping_discount',
    type: 'standard',
    title: 'Shipping discount',
    description: 'Discount on shipping. Use percentage (e.g. 100% = free) or a fixed amount off.',
    hiddenFields: [...shippingDiscountHiddenFields],
    defaults: {
      is_automatic: 'false',
      type: 'standard',
      application_method: {
        allocation: 'across',
        target_type: 'shipping_methods',
        type: 'percentage',
        value: 100
      }
    }
  }
];
