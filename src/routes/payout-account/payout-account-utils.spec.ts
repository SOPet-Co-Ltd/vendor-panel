import { describe, expect, test } from 'vitest';

import {
  buildDisableTransferSchedulePayload,
  buildPayoutAccountPayload,
  buildTransferSchedulePayload,
  getPayoutActionCopy,
  TransferScheduleSchema
} from './payout-account-utils';

describe('payout account CRUD helpers', () => {
  test('builds an account approve/create payload', () => {
    expect(
      buildPayoutAccountPayload({
        name: 'SOPet Vendor',
        email: '',
        account_type: 'individual',
        bank_brand: 'kbank',
        bank_account_number: '1234567890',
        bank_account_name: 'SOPet Vendor',
        tax_id: ''
      })
    ).toEqual({
      name: 'SOPet Vendor',
      email: undefined,
      account_type: 'individual',
      bank_brand: 'kbank',
      bank_account_number: '1234567890',
      bank_account_name: 'SOPet Vendor',
      tax_id: undefined
    });
  });

  test('builds a schedule approve/save payload with a month rule', () => {
    expect(
      buildTransferSchedulePayload({
        schedule_every: '1',
        schedule_period: 'month',
        schedule_start_date: '2026-05-01',
        schedule_end_date: '2026-12-31',
        schedule_weekday: '1st_monday',
        schedule_amount: '10000',
        schedule_percentage_of_balance: ''
      })
    ).toEqual({
      transfer_schedule: {
        enabled: true,
        every: 1,
        period: 'month',
        start_date: '2026-05-01',
        end_date: '2026-12-31',
        on: {
          weekday_of_month: '1st_monday'
        },
        amount: 10000
      }
    });
  });

  test('builds a remove schedule payload that preserves backend disable semantics', () => {
    expect(buildDisableTransferSchedulePayload()).toEqual({
      transfer_schedule: {
        enabled: false
      }
    });
  });

  test('rejects schedule drafts that set fixed amount and percentage together', () => {
    const result = TransferScheduleSchema.safeParse({
      schedule_every: '1',
      schedule_period: 'week',
      schedule_start_date: '2026-05-01',
      schedule_end_date: '2026-12-31',
      schedule_amount: '10000',
      schedule_percentage_of_balance: '50'
    });

    expect(result.success).toBe(false);
  });

  test('labels approve actions by create, edit, schedule, and remove intent', () => {
    expect(getPayoutActionCopy('approve_account', 'create').confirmText).toBe('Approve and create');
    expect(getPayoutActionCopy('approve_account', 'edit').confirmText).toBe('Approve and save');
    expect(getPayoutActionCopy('approve_schedule', 'edit').confirmText).toBe('Approve schedule');
    expect(getPayoutActionCopy('remove_schedule', 'edit').confirmText).toBe('Remove schedule');
  });
});
