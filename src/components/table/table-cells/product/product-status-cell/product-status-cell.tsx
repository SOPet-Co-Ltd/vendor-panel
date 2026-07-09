import { useTranslation } from 'react-i18next';

import { StatusCell } from '../../common/status-cell';

type ProductStatusCellProps = {
  metadata?: Record<string, unknown> | null;
};

export const ProductStatusCell = ({ metadata }: ProductStatusCellProps) => {
  const { t } = useTranslation();
  const isPublishedToSearch = metadata?.published_to_algolia === true;

  const color = isPublishedToSearch ? 'green' : 'grey';
  const text = isPublishedToSearch
    ? t('products.searchVisibility.statusPublished')
    : t('products.searchVisibility.statusNotPublished');

  return <StatusCell color={color}>{text}</StatusCell>;
};

export const ProductStatusHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center">
      <span>{t('products.searchVisibility.header')}</span>
    </div>
  );
};
