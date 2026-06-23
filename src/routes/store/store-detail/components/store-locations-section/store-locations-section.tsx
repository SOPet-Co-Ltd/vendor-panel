import { Buildings } from '@medusajs/icons';
import { Container, Heading, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

import DisplayId from '../../../../../components/common/display-id/display-id';
import { LinkButton } from '../../../../../components/common/link-button';
import { useStockLocations } from '../../../../../hooks/api/stock-locations';

export const StoreLocationsSection = () => {
  const { t } = useTranslation();
  const { stock_locations, isPending } = useStockLocations({ limit: 50 });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t('stockLocations.domain')}</Heading>
          <Text
            size="small"
            className="text-pretty text-ui-fg-subtle"
          >
            {t('store.integration.locationsHint')}
          </Text>
        </div>
        <LinkButton to="/settings/locations">{t('store.integration.manageLocations')}</LinkButton>
      </div>
      {isPending && (
        <div className="px-6 py-4">
          <Text
            size="small"
            className="text-ui-fg-subtle"
          >
            Loading...
          </Text>
        </div>
      )}
      {!isPending && !stock_locations?.length && (
        <div className="px-6 py-4">
          <Text
            size="small"
            className="text-ui-fg-subtle"
          >
            {t('store.integration.noLocations')}
          </Text>
        </div>
      )}
      {stock_locations?.map(location => (
        <div
          key={location.id}
          className="flex items-center gap-x-3 px-6 py-4"
        >
          <div className="flex size-7 items-center justify-center rounded-md shadow-borders-base">
            <Buildings className="text-ui-fg-subtle" />
          </div>
          <div className="flex flex-1 flex-col">
            <Text
              size="small"
              weight="plus"
            >
              {location.name}
            </Text>
            <Text
              size="small"
              className="font-mono text-ui-fg-subtle"
            >
              <DisplayId id={location.id} />
            </Text>
          </div>
        </div>
      ))}
    </Container>
  );
};
