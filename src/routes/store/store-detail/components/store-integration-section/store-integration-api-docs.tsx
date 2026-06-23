import { useMemo, useState, type ReactNode } from 'react';

import { SquareTwoStack, TriangleDownMini } from '@medusajs/icons';
import { Container, Heading, Text, toast } from '@medusajs/ui';
import copy from 'copy-to-clipboard';
import { useTranslation } from 'react-i18next';

type StoreIntegrationApiDocsProps = {
  sellerId: string;
};

const STATUS_CODES = [
  { code: '201', key: 'created' },
  { code: '401', key: 'unauthorized' },
  { code: '403', key: 'forbidden' },
  { code: '422', key: 'invalidData' },
  { code: '400', key: 'error' }
] as const;

function CodeBlock({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();

  const handleCopy = () => {
    copy(value);
    toast.success(t('actions.copied'));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Text
          size="small"
          weight="plus"
          className="text-ui-fg-subtle"
        >
          {label}
        </Text>
        <button
          type="button"
          onClick={handleCopy}
          className="text-ui-fg-muted hover:text-ui-fg-subtle"
          aria-label={t('actions.copy')}
        >
          <SquareTwoStack />
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-ui-bg-subtle p-3 font-mono text-xs text-ui-fg-base">
        {value}
      </pre>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Text
        size="small"
        weight="plus"
      >
        {title}
      </Text>
      {children}
    </div>
  );
}

function DocParagraph({ text }: { text: string }) {
  return (
    <Text
      size="small"
      className="text-pretty text-ui-fg-subtle"
    >
      {text}
    </Text>
  );
}

export const StoreIntegrationApiDocs = ({ sellerId }: StoreIntegrationApiDocsProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  const endpoint = `POST /integrations/vendors/${sellerId}/products`;

  const singleVariantBody = useMemo(
    () =>
      JSON.stringify(
        {
          product: {
            title: 'Premium Salmon Dry Dog Food',
            description: 'High protein adult dog food',
            external_id: 'ERP-12345',
            status: 'proposed',
            options: [{ title: 'Size', values: ['2kg'] }],
            variants: [
              {
                sku: 'SALMON-2KG',
                options: { Size: '2kg' },
                prices: [{ currency_code: 'thb', amount: 89000 }],
                inventory: [{ location_id: 'sloc_01EXAMPLE', stocked_quantity: 25 }]
              }
            ],
            custom_tag_1: 'dog',
            custom_tag_2: 'Acme'
          }
        },
        null,
        2
      ),
    []
  );

  const multiVariantBody = useMemo(
    () =>
      JSON.stringify(
        {
          product: {
            title: 'Premium Dog Treats',
            external_id: 'ERP-67890',
            options: [
              { title: 'Size', values: ['200g', '500g'] },
              { title: 'Flavor', values: ['Chicken', 'Beef'] }
            ],
            variants: [
              {
                sku: 'TREAT-200G-CHICKEN',
                options: { Size: '200g', Flavor: 'Chicken' },
                prices: [{ currency_code: 'thb', amount: 19900 }],
                inventory: [
                  { location_id: 'sloc_01EXAMPLE', stocked_quantity: 40 },
                  { location_id: 'sloc_01WAREHOUSE', stocked_quantity: 120 }
                ]
              },
              {
                sku: 'TREAT-500G-BEEF',
                options: { Size: '500g', Flavor: 'Beef' },
                prices: [{ currency_code: 'thb', amount: 45900 }],
                inventory: [{ location_id: 'sloc_01EXAMPLE', stocked_quantity: 15 }]
              }
            ]
          }
        },
        null,
        2
      ),
    []
  );

  const responseBody = useMemo(
    () =>
      JSON.stringify(
        {
          product: {
            id: 'prod_01EXAMPLE',
            handle: 'premium-salmon-dry-dog-food',
            external_id: 'ERP-12345',
            variants: [{ id: 'variant_01EXAMPLE', sku: 'SALMON-2KG' }]
          },
          inventory_levels: [
            {
              variant_id: 'variant_01EXAMPLE',
              location_id: 'sloc_01EXAMPLE',
              stocked_quantity: 25
            }
          ]
        },
        null,
        2
      ),
    []
  );

  const headersExample = useMemo(
    () =>
      ['Content-Type: application/json', 'x-vendor-integration-secret: sopet_sk_YOUR_SECRET'].join(
        '\n'
      ),
    []
  );

  return (
    <Container className="divide-y p-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen(current => !current)}
      >
        <Heading level="h2">{t('store.integration.docs.title')}</Heading>
        <TriangleDownMini
          className={`text-ui-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-6 px-6 py-4">
          <DocSection title={t('store.integration.docs.overviewTitle')}>
            <DocParagraph text={t('store.integration.docs.overview')} />
          </DocSection>

          <DocSection title={t('store.integration.docs.authTitle')}>
            <DocParagraph text={t('store.integration.docs.auth')} />
            <Text
              size="small"
              className="font-mono text-ui-fg-base"
            >
              {endpoint}
            </Text>
          </DocSection>

          <div>
            <Text
              size="small"
              weight="plus"
              className="mb-2"
            >
              {t('store.integration.docs.headers')}
            </Text>
            <CodeBlock
              label={t('store.integration.docs.requiredHeaders')}
              value={headersExample}
            />
          </div>

          <DocSection title={t('store.integration.docs.behavior')}>
            <DocParagraph text={t('store.integration.docs.behaviorList')} />
          </DocSection>

          <div>
            <Text
              size="small"
              className="mb-3 text-ui-fg-subtle"
            >
              {t('store.integration.docs.bodyHint')}
            </Text>
            <CodeBlock
              label={t('store.integration.docs.singleVariant')}
              value={singleVariantBody}
            />
          </div>

          <div>
            <Text
              size="small"
              className="mb-3 text-ui-fg-subtle"
            >
              {t('store.integration.docs.multiVariantHint')}
            </Text>
            <CodeBlock
              label={t('store.integration.docs.multiVariant')}
              value={multiVariantBody}
            />
          </div>

          <DocSection title={t('store.integration.docs.requiredFields')}>
            <DocParagraph text={t('store.integration.docs.requiredFieldsList')} />
            <DocParagraph text={t('store.integration.docs.pricingNote')} />
            <DocParagraph text={t('store.integration.docs.inventoryNote')} />
          </DocSection>

          <DocSection title={t('store.integration.docs.optionalFields')}>
            <DocParagraph text={t('store.integration.docs.optionalFieldsList')} />
          </DocSection>

          <DocSection title={t('store.integration.docs.rejectedFields')}>
            <DocParagraph text={t('store.integration.docs.rejectedFieldsList')} />
            <DocParagraph text={t('store.integration.docs.mediaNote')} />
          </DocSection>

          <div>
            <CodeBlock
              label={t('store.integration.docs.responseBody')}
              value={responseBody}
            />
          </div>

          <div>
            <Text
              size="small"
              weight="plus"
              className="mb-2"
            >
              {t('store.integration.docs.statusCodes')}
            </Text>
            <div className="divide-y rounded-lg border border-ui-border-base">
              {STATUS_CODES.map(({ code, key }) => (
                <div
                  key={code}
                  className="grid grid-cols-[4rem_1fr] gap-3 px-3 py-2"
                >
                  <Text
                    size="small"
                    className="font-mono"
                  >
                    {code}
                  </Text>
                  <Text
                    size="small"
                    className="text-ui-fg-subtle"
                  >
                    {t(`store.integration.docs.status.${key}`)}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <DocSection title={t('store.integration.docs.postCreate')}>
            <DocParagraph text={t('store.integration.docs.postCreateList')} />
          </DocSection>

          <DocSection title={t('store.integration.docs.referenceData')}>
            <DocParagraph text={t('store.integration.docs.referenceDataList')} />
          </DocSection>
        </div>
      )}
    </Container>
  );
};
