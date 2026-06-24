import { useState } from 'react';

import { Button, Container, Copy, Heading, Text, toast, usePrompt } from '@medusajs/ui';
import copy from 'copy-to-clipboard';
import { useTranslation } from 'react-i18next';

import {
  getIntegrationProductsEndpoint,
  useIntegrationSecret,
  useRegenerateIntegrationSecret
} from '../../../../../hooks/api/vendor-integration';
import { StoreVendor } from '../../../../../types/user';
import { StoreIntegrationApiDocs } from './store-integration-api-docs';

export const StoreIntegrationSection = ({ seller }: { seller: StoreVendor }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const { has_key, prefix, created_at, isPending } = useIntegrationSecret();
  const { mutateAsync: regenerate, isPending: isRegenerating } = useRegenerateIntegrationSecret();

  const endpoint = getIntegrationProductsEndpoint(seller.id);

  const handleCopyEndpoint = () => {
    copy(endpoint);
    toast.success(t('actions.copied'));
  };

  const handleCopySecret = () => {
    if (!revealedSecret) {
      return;
    }
    copy(revealedSecret);
    toast.success(t('actions.copied'));
  };

  const handleRegenerate = async () => {
    const confirmed = await prompt({
      title: t('store.integration.regenerateConfirmTitle'),
      description: t('store.integration.regenerateConfirmDescription'),
      confirmText: t('store.integration.regenerateKey'),
      cancelText: t('actions.cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await regenerate();
      setRevealedSecret(result.secret);
      toast.success(t('store.integration.regenerateSuccess'));
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>{t('store.integration.apiTitle')}</Heading>
            <Text
              size="small"
              className="text-pretty text-ui-fg-subtle"
            >
              {t('store.integration.apiHint')}
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            isLoading={isRegenerating}
            onClick={handleRegenerate}
          >
            {has_key ? t('store.integration.regenerateKey') : t('store.integration.generateKey')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-y-2 px-6 py-4 text-ui-fg-subtle">
          <Text
            size="small"
            leading="compact"
            weight="plus"
          >
            {t('store.integration.endpoint')}
          </Text>
          <div className="flex items-center gap-2">
            <Text
              size="small"
              leading="compact"
              className="break-all font-mono"
            >
              POST {endpoint}
            </Text>
            <Copy
              className="shrink-0 cursor-pointer"
              onClick={handleCopyEndpoint}
            />
          </div>

          <Text
            size="small"
            leading="compact"
            weight="plus"
          >
            {t('store.integration.secretHeader')}
          </Text>
          <Text
            size="small"
            leading="compact"
            className="font-mono"
          >
            x-vendor-integration-secret
          </Text>

          <Text
            size="small"
            leading="compact"
            weight="plus"
          >
            {t('store.integration.secretKey')}
          </Text>
          <Text
            size="small"
            leading="compact"
          >
            {isPending
              ? '—'
              : revealedSecret
                ? revealedSecret
                : has_key && prefix
                  ? `${prefix}…`
                  : t('store.integration.noKey')}
          </Text>

          {created_at && (
            <>
              <Text
                size="small"
                leading="compact"
                weight="plus"
              >
                {t('fields.createdAt')}
              </Text>
              <Text
                size="small"
                leading="compact"
              >
                {new Date(created_at).toLocaleString()}
              </Text>
            </>
          )}
        </div>

        {revealedSecret && (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <Text
              size="small"
              className="text-ui-fg-subtle"
            >
              {t('store.integration.secretShownOnce')}
            </Text>
            <Button
              size="small"
              variant="secondary"
              onClick={handleCopySecret}
            >
              {t('store.integration.copySecret')}
            </Button>
          </div>
        )}
      </Container>
      <StoreIntegrationApiDocs sellerId={seller.id} />
    </>
  );
};
