import { useMemo, useState } from 'react';

import { CheckCircleSolid, XCircleSolid } from '@medusajs/icons';
import { Button, Container, Heading, StatusBadge, Text, toast, usePrompt } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

import {
  usePublishProductToAlgolia,
  useUnpublishProductFromAlgolia
} from '../../../../../hooks/api/algolia';
import { useVendorProductSetupRequirements } from '../../../../../hooks/use-vendor-product-setup-requirements';
import { ExtendedAdminProduct } from '../../../../../types/products';

type ProductSearchVisibilitySectionProps = {
  product: ExtendedAdminProduct;
};

/** Requirements checked by backend validateProductForAlgolia. */
function usePublishRequirements(product: ExtendedAdminProduct) {
  return useMemo(() => {
    const hasTitle = Boolean(product.title?.trim());
    const hasHandle = Boolean(product.handle?.trim());
    const hasDescription = Boolean(product.description?.trim());
    const isPublished = product.status === 'published';
    const hasThumbnailOrImage =
      Boolean(product.thumbnail?.trim()) ||
      (Array.isArray(product.images) && product.images.length > 0);
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const hasVariantPrice =
      hasVariants && (product.variants?.some(v => (v.prices?.length ?? 0) > 0) ?? false);
    const hasVariantLocation =
      hasVariants &&
      product.variants!.some(v => {
        const fromInventory =
          Array.isArray(v.inventory) &&
          v.inventory.some(inv => (inv?.location_levels?.length ?? 0) > 0);
        if (fromInventory) return true;
        const fromInventoryItems =
          Array.isArray(v.inventory_items) &&
          v.inventory_items.some(item => (item?.inventory?.location_levels?.length ?? 0) > 0);
        return fromInventoryItems;
      });

    return {
      hasTitle,
      hasHandle,
      hasDescription,
      isPublished,
      hasThumbnailOrImage,
      hasVariants,
      hasVariantPrice,
      hasVariantLocation,
      allMet:
        hasTitle &&
        hasHandle &&
        hasDescription &&
        isPublished &&
        hasThumbnailOrImage &&
        hasVariants &&
        hasVariantPrice &&
        hasVariantLocation
    };
  }, [product]);
}

export const ProductSearchVisibilitySection = ({
  product
}: ProductSearchVisibilitySectionProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const [lastPublishError, setLastPublishError] = useState<string | null>(null);

  const isPublishedToSearch = product.metadata?.published_to_algolia === true;
  const publishedAt = product.metadata?.algolia_published_at as string | undefined;
  const requirements = usePublishRequirements(product);
  const vendorRequirements = useVendorProductSetupRequirements();
  const allRequirementsMet =
    requirements.allMet &&
    vendorRequirements.hasShippingMethod &&
    vendorRequirements.hasOmiseConnected;

  const publishMutation = usePublishProductToAlgolia(product.id);
  const unpublishMutation = useUnpublishProductFromAlgolia(product.id);

  const handlePublish = () => {
    setLastPublishError(null);
    publishMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('products.searchVisibility.toasts.publishSuccess'));
      },
      onError: err => {
        setLastPublishError(err.message);
        toast.error(err.message);
      }
    });
  };

  const handleUnpublish = async () => {
    const confirmed = await prompt({
      title: t('products.searchVisibility.unpublishConfirmTitle'),
      description: t('products.searchVisibility.unpublishConfirmDescription')
    });
    if (!confirmed) return;
    setLastPublishError(null);
    unpublishMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('products.searchVisibility.toasts.unpublishSuccess'));
      },
      onError: err => {
        toast.error(err.message);
      }
    });
  };

  const formattedDate: string | null =
    publishedAt == null
      ? null
      : (() => {
          try {
            return new Date(String(publishedAt)).toLocaleDateString(undefined, {
              dateStyle: 'medium'
            });
          } catch {
            return null;
          }
        })();

  const requirementItems = [
    {
      key: 'title',
      met: requirements.hasTitle,
      label: t('products.searchVisibility.requirementTitle')
    },
    {
      key: 'handle',
      met: requirements.hasHandle,
      label: t('products.searchVisibility.requirementHandle')
    },
    {
      key: 'published',
      met: requirements.isPublished,
      label: t('products.searchVisibility.requirementPublished')
    },
    {
      key: 'thumbnail',
      met: requirements.hasThumbnailOrImage,
      label: t('products.searchVisibility.requirementThumbnailOrImage')
    },
    {
      key: 'description',
      met: requirements.hasDescription,
      label: t('products.searchVisibility.requirementDescription')
    },
    {
      key: 'variants',
      met: requirements.hasVariants,
      label: t('products.searchVisibility.requirementVariants')
    },
    {
      key: 'variantPrice',
      met: requirements.hasVariantPrice,
      label: t('products.searchVisibility.requirementVariantPrice')
    },
    {
      key: 'variantLocation',
      met: requirements.hasVariantLocation,
      label: t('products.searchVisibility.requirementVariantLocation')
    },
    {
      key: 'seller',
      met: true,
      label: t('products.searchVisibility.requirementSeller')
    },
    {
      key: 'shippingMethod',
      met: vendorRequirements.hasShippingMethod,
      label: t('products.searchVisibility.requirementShippingMethod')
    },
    {
      key: 'omiseConnected',
      met: vendorRequirements.hasOmiseConnected,
      label: t('products.searchVisibility.requirementOmiseConnected')
    }
  ];

  const missingCount = requirementItems.filter(r => !r.met).length;

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t('products.searchVisibility.header')}</Heading>
      </div>
      <div className="flex flex-col gap-3 px-6 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <StatusBadge color={isPublishedToSearch ? 'green' : 'grey'}>
            {
              (isPublishedToSearch
                ? t('products.searchVisibility.statusPublished')
                : t('products.searchVisibility.statusNotPublished')) as string
            }
          </StatusBadge>
          {isPublishedToSearch && formattedDate && (
            <Text
              size="small"
              className="text-ui-fg-muted"
            >
              {t('products.searchVisibility.publishedAt', { date: formattedDate })}
            </Text>
          )}
        </div>

        {!isPublishedToSearch && (
          <>
            <Text
              size="small"
              className="text-ui-fg-muted"
            >
              {t('products.searchVisibility.requirementsTitle')}
            </Text>
            <ul className="flex list-none flex-col gap-1.5">
              {requirementItems.map(item => (
                <li
                  key={item.key}
                  className="flex items-center gap-2"
                >
                  {item.met ? (
                    <CheckCircleSolid className="text-ui-fg-success" />
                  ) : (
                    <XCircleSolid className="text-ui-fg-error" />
                  )}
                  <Text
                    size="small"
                    className={item.met ? 'text-ui-fg-subtle' : 'text-ui-fg-base'}
                  >
                    {item.label}
                  </Text>
                </li>
              ))}
            </ul>
            {missingCount > 0 && (
              <Text
                size="small"
                className="text-ui-fg-muted"
              >
                {t('products.searchVisibility.missingCount', { count: missingCount })}
              </Text>
            )}
          </>
        )}

        {lastPublishError && (
          <div className="rounded-md border border-ui-border-error bg-ui-bg-subtle px-3 py-2">
            <Text
              size="small"
              className="text-ui-fg-error"
            >
              {t('products.searchVisibility.lastError')} {lastPublishError}
            </Text>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isPublishedToSearch ? (
            <Button
              size="small"
              variant="secondary"
              onClick={handleUnpublish}
              disabled={unpublishMutation.isPending}
            >
              {t('products.searchVisibility.unpublishButton')}
            </Button>
          ) : (
            <Button
              size="small"
              variant="secondary"
              onClick={handlePublish}
              disabled={
                !allRequirementsMet || vendorRequirements.isLoading || publishMutation.isPending
              }
            >
              {t('products.searchVisibility.publishButton')}
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
};
