import { CheckCircleSolid, XCircleSolid } from '@medusajs/icons';
import { Button, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useVendorProductSetupRequirements } from '../../hooks/use-vendor-product-setup-requirements';

export const VendorProductSetupRequired = () => {
  const { t } = useTranslation();
  const setup = useVendorProductSetupRequirements();

  const items = [
    {
      key: 'shippingMethod',
      met: setup.hasShippingMethod,
      label: t('products.searchVisibility.requirementShippingMethod')
    },
    {
      key: 'omiseConnected',
      met: setup.hasOmiseConnected,
      label: t('products.searchVisibility.requirementOmiseConnected')
    }
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <Text
        weight="plus"
        size="small"
      >
        {t('products.setupRequired.title')}
      </Text>
      <Text
        size="small"
        className="text-ui-fg-subtle"
      >
        {t('products.setupRequired.description')}
      </Text>
      <ul className="flex list-none flex-col gap-1.5">
        {items.map(item => (
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
      <div className="flex flex-wrap gap-2">
        {!setup.hasShippingMethod && (
          <Button
            size="small"
            variant="secondary"
            asChild
          >
            <Link to="/settings/locations">{t('products.setupRequired.shippingAction')}</Link>
          </Button>
        )}
        {!setup.hasOmiseConnected && (
          <Button
            size="small"
            variant="secondary"
            asChild
          >
            <Link to="/payout-account">{t('products.setupRequired.omiseAction')}</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
