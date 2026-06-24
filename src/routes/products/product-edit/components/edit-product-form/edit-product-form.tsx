import { HttpTypes } from '@medusajs/types';
import { Button, Input, Select, Text, Textarea, toast } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import * as zod from 'zod';

import { Form } from '../../../../../components/common/form';
import { SwitchBox } from '../../../../../components/common/switch-box';
import { RouteDrawer, useRouteModal } from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { FormExtensionZone, useDashboardExtension } from '../../../../../extensions';
import { useExtendableForm } from '../../../../../extensions/forms/hooks';
import { useUpdateProduct } from '../../../../../hooks/api/products';
import { ExtendedAdminProduct } from '../../../../../types/products';

type EditProductFormProps = {
  product: ExtendedAdminProduct;
};

const VENDOR_PRODUCT_STATUSES = ['draft', 'proposed', 'published'] as const;
type VendorProductStatus = (typeof VENDOR_PRODUCT_STATUSES)[number];

const STATUS_PROMOTION: Record<string, VendorProductStatus | null> = {
  draft: 'proposed',
  proposed: 'published',
  rejected: 'proposed'
};

const getNextVendorProductStatus = (
  currentStatus: HttpTypes.AdminProductStatus
): VendorProductStatus | null => {
  return STATUS_PROMOTION[currentStatus] ?? null;
};

const getSelectableVendorStatuses = (
  currentStatus: HttpTypes.AdminProductStatus
): VendorProductStatus[] => {
  const nextStatus = getNextVendorProductStatus(currentStatus);

  if (currentStatus === 'rejected') {
    return nextStatus ? [nextStatus] : [];
  }

  const normalizedStatus = VENDOR_PRODUCT_STATUSES.includes(currentStatus as VendorProductStatus)
    ? (currentStatus as VendorProductStatus)
    : 'draft';

  if (!nextStatus) {
    return [normalizedStatus];
  }

  return [normalizedStatus, nextStatus];
};

const EditProductSchema = zod.object({
  status: zod.enum(VENDOR_PRODUCT_STATUSES),
  title: zod.string().min(1),
  handle: zod.string().min(1),
  description: zod.string().optional(),
  discountable: zod.boolean()
});

const getDefaultProductStatus = (
  currentStatus: HttpTypes.AdminProductStatus,
  selectableStatuses: VendorProductStatus[]
): VendorProductStatus => {
  if (selectableStatuses.includes(currentStatus as VendorProductStatus)) {
    return currentStatus as VendorProductStatus;
  }

  return selectableStatuses[0] ?? 'draft';
};

export const EditProductForm = ({ product }: EditProductFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const selectableStatuses = getSelectableVendorStatuses(product.status);
  const canPromoteStatus =
    getNextVendorProductStatus(product.status) !== null && product.status !== 'published';

  const { getFormFields, getFormConfigs } = useDashboardExtension();
  const fields = getFormFields('product', 'edit');
  const configs = getFormConfigs('product', 'edit');

  const form = useExtendableForm({
    defaultValues: {
      status: getDefaultProductStatus(product.status, selectableStatuses),
      title: product.title,
      handle: product.handle || '',
      description: product.description || '',
      discountable: product.discountable
    },
    schema: EditProductSchema,
    configs: configs,
    data: product
  });

  const { mutateAsync, isPending } = useUpdateProduct(product.id);

  const handleSubmit = form.handleSubmit(async data => {
    const { description, discountable, handle, status, title } = data;
    const shouldUpdateStatus =
      status !== product.status && getNextVendorProductStatus(product.status) === status;

    await mutateAsync(
      {
        description,
        discountable,
        handle,
        ...(shouldUpdateStatus ? { status: status as HttpTypes.AdminProductStatus } : {}),
        title
      },
      {
        onSuccess: ({ product }) => {
          toast.success(
            t('products.edit.successToast', {
              title: product.title
            })
          );
          handleSuccess(`/products/${product.id}`);
        },
        onError: e => {
          toast.error(e.message);
        }
      }
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              {canPromoteStatus ? (
                <Form.Field
                  control={form.control}
                  name="status"
                  render={({ field: { onChange, ref, ...field } }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t('fields.status')}</Form.Label>
                        <Form.Control>
                          <Select
                            {...field}
                            onValueChange={onChange}
                          >
                            <Select.Trigger ref={ref}>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              {selectableStatuses.map(status => {
                                return (
                                  <Select.Item
                                    key={status}
                                    value={status}
                                  >
                                    {t(`products.productStatus.${status}`)}
                                  </Select.Item>
                                );
                              })}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
              ) : (
                <Form.Item>
                  <Form.Label>{t('fields.status')}</Form.Label>
                  <Form.Control>
                    <Input
                      disabled
                      value={t(`products.productStatus.${product.status}`)}
                    />
                  </Form.Control>
                </Form.Item>
              )}
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t('fields.title')}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              {/* <Form.Field
                control={form.control}
                name='subtitle'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>
                        {t('fields.subtitle')}
                      </Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              /> */}
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t('fields.handle')}</Form.Label>
                      <Form.Control>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r">
                            <Text
                              className="text-ui-fg-muted"
                              size="small"
                              leading="compact"
                              weight="plus"
                            >
                              /
                            </Text>
                          </div>
                          <Input
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              {/* <Form.Field
                control={form.control}
                name='material'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>
                        {t('fields.material')}
                      </Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              /> */}
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t('fields.description')}</Form.Label>
                      <Form.Control>
                        <Textarea {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
            </div>
            <SwitchBox
              control={form.control}
              name="discountable"
              label={t('fields.discountable')}
              description={t('products.discountableHint')}
            />
            <FormExtensionZone
              fields={fields}
              form={form}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
              >
                {t('actions.cancel')}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
