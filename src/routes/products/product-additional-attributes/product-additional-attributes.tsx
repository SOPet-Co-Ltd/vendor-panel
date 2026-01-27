'use client';

import { Spinner } from '@medusajs/icons';
import { Heading } from '@medusajs/ui';
import { useParams } from 'react-router-dom';

import { RouteDrawer } from '../../../components/modals';
import { useProduct, useProductAttributes } from '../../../hooks/api';
import { ProductAdditionalAttributesForm } from './components/product-additional-attributes-form';

export const ProductAdditionalAttributes = () => {
  const { id } = useParams();
  const { product, isLoading: isProductLoading } = useProduct(id!);

  const { attributes, isLoading: isAttributesLoading } = useProductAttributes(id!);

  const isReady = !isAttributesLoading && attributes && !isProductLoading && product;

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading level="h2">Edit Additional Attributes</Heading>
      </RouteDrawer.Header>
      {isReady ? (
        <ProductAdditionalAttributesForm
          product={product}
          attributes={attributes}
          id={id!}
        />
      ) : (
        <Spinner className="animate-spin text-ui-fg-interactive" />
      )}
    </RouteDrawer>
  );
};
