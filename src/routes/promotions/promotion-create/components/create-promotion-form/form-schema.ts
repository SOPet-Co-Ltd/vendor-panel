import { z } from 'zod';

import { CreateCampaignSchema } from '../../../../campaigns/campaign-create/components/create-campaign-form';

const RuleSchema = z.array(
  z.object({
    id: z.string().optional(),
    attribute: z.string().trim().min(1, { message: 'Required field' }),
    operator: z.string().trim().min(1, { message: 'Required field' }),
    values: z.union([
      z.number().min(1, { message: 'Required field' }),
      z.string().trim().min(1, { message: 'Required field' }),
      z.array(z.string()).min(1, { message: 'Required field' })
    ]),
    required: z.boolean().optional(),
    disguised: z.boolean().optional(),
    field_type: z.string().optional()
  })
);

export const CreatePromotionSchema = z
  .object({
    template_id: z.string().optional(),
    campaign_id: z.string().optional(),
    campaign_choice: z.enum(['none', 'existing', 'new']).optional(),
    is_automatic: z.string().toLowerCase(),
    code: z.string().trim().min(1),
    type: z.enum(['buyget', 'standard']),
    status: z.enum(['draft', 'active', 'inactive']),
    rules: RuleSchema,
    is_tax_inclusive: z.boolean().optional(),
    application_method: z.object({
      allocation: z.enum(['each', 'across']),
      value: z.number().min(0).or(z.string().trim().min(1)),
      currency_code: z.string().optional(),
      max_quantity: z.number().optional().nullable(),
      apply_to_quantity: z.number().optional().nullable(),
      buy_rules_min_quantity: z.number().optional().nullable(),
      target_rules: RuleSchema,
      buy_rules: RuleSchema,
      type: z.enum(['fixed', 'percentage']),
      target_type: z.enum(['order', 'shipping_methods', 'items'])
    }),
    campaign: CreateCampaignSchema.optional()
  })
  .refine(
    data => {
      if (data.type === 'buyget') {
        return (
          typeof data.application_method.apply_to_quantity === 'number' &&
          typeof data.application_method.buy_rules_min_quantity === 'number' &&
          typeof data.application_method.max_quantity === 'number'
        );
      }
      if (data.application_method.target_type === 'shipping_methods') {
        return true;
      }
      if (data.application_method.allocation === 'across') {
        return true;
      }
      return (
        data.application_method.allocation === 'each' &&
        typeof data.application_method.max_quantity === 'number'
      );
    },
    {
      path: ['application_method.max_quantity'],
      message: `required field`
    }
  )
  .refine(
    data => data.application_method.type !== 'fixed' || !!data.application_method.currency_code,
    {
      path: ['application_method.currency_code'],
      message: 'required field'
    }
  )
  .refine(
    data => {
      if (data.application_method.type !== 'percentage') {
        return true;
      }

      const value = parseFloat(String(data.application_method.value));

      return value > 0 && value <= 100;
    },
    {
      path: ['application_method.value'],
      message: 'Value must be between 1 and 100'
    }
  );

export type CreatePromotionSchemaType = z.infer<typeof CreatePromotionSchema>;
