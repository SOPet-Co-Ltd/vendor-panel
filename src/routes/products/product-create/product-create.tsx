import { useTranslation } from 'react-i18next';

import { RouteFocusModal } from '../../../components/modals';
import { VendorProductSetupRequired } from '../../../components/vendor-product-setup/vendor-product-setup-required';
import { useSalesChannels } from '../../../hooks/api';
import { useStore } from '../../../hooks/api/store';
import { useVendorProductSetupRequirements } from '../../../hooks/use-vendor-product-setup-requirements';
import { ProductCreateForm } from './components/product-create-form/product-create-form';

export const ProductCreate = () => {
  const { t } = useTranslation();
  const setup = useVendorProductSetupRequirements();

  const { store, isPending: isStorePending } = useStore();

  const { sales_channels, isPending: isSalesChannelPending } = useSalesChannels();

  const ready =
    setup.isReady &&
    !setup.isLoading &&
    !!store &&
    !isStorePending &&
    !!sales_channels &&
    !isSalesChannelPending;

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t('products.create.title')}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t('products.create.description')}</span>
      </RouteFocusModal.Description>
      {!setup.isLoading && !setup.isReady ? (
        <VendorProductSetupRequired />
      ) : (
        ready && (
          <ProductCreateForm
            defaultChannel={sales_channels[0]}
            store={store}
          />
        )
      )}
    </RouteFocusModal>
  );
};
