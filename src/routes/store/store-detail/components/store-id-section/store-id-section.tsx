import { Container, Heading, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

import DisplayId from '../../../../../components/common/display-id/display-id';
import { StoreVendor } from '../../../../../types/user';

export const StoreIdSection = ({ seller }: { seller: StoreVendor }) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>{t('store.integration.storeId')}</Heading>
        <Text
          size="small"
          className="text-pretty text-ui-fg-subtle"
        >
          {t('store.integration.storeIdHint')}
        </Text>
      </div>
      <div className="grid grid-cols-2 px-6 py-4 text-ui-fg-subtle">
        <Text
          size="small"
          leading="compact"
          weight="plus"
        >
          {t('fields.id')}
        </Text>
        <Text
          size="small"
          leading="compact"
          className="font-mono"
        >
          <DisplayId id={seller.id} />
        </Text>
      </div>
    </Container>
  );
};
