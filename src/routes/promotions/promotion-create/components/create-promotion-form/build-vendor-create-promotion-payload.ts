import type { CreatePromotionSchemaType } from './form-schema';

type VendorPromotionRule = {
  operator: 'in' | 'eq';
  attribute: string;
  values: string | string[];
  description?: string | null;
};

type VendorCreatePromotionPayload = {
  code: string;
  status: CreatePromotionSchemaType['status'];
  is_automatic: false;
  is_tax_inclusive?: boolean;
  type: 'standard' | 'buyget';
  campaign_id?: string | null;
  campaign?: {
    name: string;
    campaign_identifier: string;
    description?: string | null;
    starts_at?: Date | null;
    ends_at?: Date | null;
    budget?: {
      type: 'spend' | 'usage';
      limit?: number | null;
      currency_code?: string | null;
    } | null;
  };
  rules?: VendorPromotionRule[];
  application_method: {
    description?: string | null;
    value: number;
    max_quantity?: number | null;
    currency_code?: string | null;
    type: 'fixed' | 'percentage';
    target_type: 'items' | 'order' | 'shipping_methods';
    allocation: 'each' | 'across';
    target_rules?: VendorPromotionRule[];
    buy_rules?: VendorPromotionRule[];
    apply_to_quantity?: number | null;
    buy_rules_min_quantity?: number | null;
  };
};

const toVendorRuleValues = (values: unknown): string | string[] => {
  if (Array.isArray(values)) {
    return values.map(String);
  }

  return String(values);
};

const toVendorOperator = (operator: string): 'in' | 'eq' => (operator === 'in' ? 'in' : 'eq');

const buildVendorRules = (
  rules: {
    operator: string;
    attribute: string;
    values: unknown;
    disguised?: boolean;
  }[] = []
): VendorPromotionRule[] =>
  rules
    .filter(rule => !rule.disguised)
    .map(rule => ({
      operator: toVendorOperator(rule.operator),
      attribute: rule.attribute,
      values: toVendorRuleValues(rule.values)
    }));

export const buildVendorCreatePromotionPayload = (
  data: CreatePromotionSchemaType
): VendorCreatePromotionPayload => {
  const {
    campaign_choice,
    is_tax_inclusive,
    template_id: _templateId,
    application_method,
    rules,
    campaign_id,
    campaign,
    code,
    status,
    type
  } = data;

  const {
    target_rules: targetRulesData = [],
    buy_rules: buyRulesData = [],
    ...applicationMethodData
  } = application_method;

  const disguisedRules = [
    ...targetRulesData.filter(rule => !!rule.disguised),
    ...buyRulesData.filter(rule => !!rule.disguised),
    ...rules.filter(rule => !!rule.disguised)
  ];

  const applicationMethodRuleData: Record<string, number | null | undefined> = {};

  for (const rule of disguisedRules) {
    if (rule.field_type === 'number') {
      applicationMethodRuleData[rule.attribute] = parseInt(String(rule.values), 10);
    }
  }

  const campaignPayload =
    campaign_choice === 'new' && campaign
      ? {
          name: campaign.name,
          campaign_identifier: campaign.campaign_identifier,
          description: campaign.description,
          starts_at: campaign.starts_at,
          ends_at: campaign.ends_at,
          budget: campaign.budget
            ? {
                type: campaign.budget.type as 'spend' | 'usage',
                limit: campaign.budget.limit,
                currency_code:
                  campaign.budget.type === 'spend' ? campaign.budget.currency_code : null
              }
            : null
        }
      : undefined;

  const targetType = applicationMethodData.target_type;
  const allocation = applicationMethodData.allocation;
  const methodType = applicationMethodData.type;

  const targetRules = targetType === 'items' ? buildVendorRules(targetRulesData) : undefined;

  const buyRules = type === 'buyget' ? buildVendorRules(buyRulesData) : undefined;

  const applicationMethod: VendorCreatePromotionPayload['application_method'] = {
    value: parseFloat(String(applicationMethodData.value)),
    type: methodType,
    target_type: targetType,
    allocation,
    apply_to_quantity:
      applicationMethodRuleData.apply_to_quantity ??
      applicationMethodData.apply_to_quantity ??
      (type === 'buyget' ? 1 : undefined),
    buy_rules_min_quantity:
      applicationMethodRuleData.buy_rules_min_quantity ??
      applicationMethodData.buy_rules_min_quantity ??
      (type === 'buyget' ? 1 : undefined)
  };

  if (methodType === 'fixed') {
    applicationMethod.currency_code = applicationMethodData.currency_code;
  }

  if (allocation === 'across') {
    delete applicationMethod.max_quantity;
  } else {
    applicationMethod.max_quantity =
      applicationMethodData.max_quantity ?? (type === 'buyget' ? 1 : 1);
  }

  if (targetRules?.length) {
    applicationMethod.target_rules = targetRules;
  }

  if (buyRules?.length) {
    applicationMethod.buy_rules = buyRules;
  }

  const promotionRules = buildVendorRules(rules);

  return {
    code,
    status,
    is_automatic: false,
    is_tax_inclusive,
    type,
    campaign_id: campaign_choice === 'existing' ? campaign_id : undefined,
    campaign: campaignPayload,
    ...(promotionRules.length ? { rules: promotionRules } : {}),
    application_method: applicationMethod
  };
};
