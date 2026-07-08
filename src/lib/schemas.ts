import i18n from 'i18next';
import { z } from 'zod';

/** Required string: rejects empty and whitespace-only values (e.g. " "). */
export const requiredTrimmedString = (message?: string) =>
  message ? z.string().trim().min(1, message) : z.string().trim().min(1);

/** Optional string: empty allowed; whitespace-only rejected. */
export const optionalTrimmedString = () =>
  z.union([z.literal(''), z.string().trim().min(1)]).optional();

export const AddressSchema = z.object({
  first_name: requiredTrimmedString(),
  last_name: requiredTrimmedString(),
  company: z.string().optional(),
  address_1: requiredTrimmedString(),
  address_2: z.string().optional(),
  city: requiredTrimmedString(),
  postal_code: requiredTrimmedString(),
  province: z.string().optional(),
  country_code: requiredTrimmedString(),
  phone: z.string().optional()
});

export const EmailSchema = z.object({
  email: z.string().trim().min(1).email()
});

export const TransferOwnershipSchema = z
  .object({
    current_owner_id: requiredTrimmedString(),
    new_owner_id: requiredTrimmedString(i18n.t('transferOwnership.validation.required'))
  })
  .superRefine((data, ctx) => {
    if (data.current_owner_id === data.new_owner_id) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_owner_id'],
        message: i18n.t('transferOwnership.validation.mustBeDifferent')
      });
    }
  });
