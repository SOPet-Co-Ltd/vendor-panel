import { getLinkedFields } from '../../../extensions';

// Linked fields without custom_tags (fetched via dedicated endpoint)
export const PRODUCT_DETAIL_FIELDS = getLinkedFields('product', '');

// Full fields string for product detail (used by loader and useProduct for consistent cache key)
export const FULL_PRODUCT_DETAIL_FIELDS = [
  '*variants.inventory_items,*categories,attribute_values.*,attribute_values.attribute.*',
  'metadata',
  PRODUCT_DETAIL_FIELDS
]
  .filter(Boolean)
  .join(',');
