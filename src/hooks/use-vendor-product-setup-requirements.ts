import { useMemo } from 'react';

import { usePayoutAccount } from './api';
import { useShippingOptions } from './api/shipping-options';

export function useVendorProductSetupRequirements() {
  const { shipping_options = [], isPending: isShippingPending } = useShippingOptions(
    { limit: 200 },
    { staleTime: 5 * 60 * 1000 }
  );
  const { payout_account, isPending: isPayoutPending } = usePayoutAccount();

  return useMemo(() => {
    const hasShippingMethod = shipping_options.length > 0;
    const hasOmiseConnected =
      Boolean(payout_account?.omise_recipient_id?.trim()) && payout_account?.status === 'active';
    const isReady = hasShippingMethod && hasOmiseConnected;

    return {
      hasShippingMethod,
      hasOmiseConnected,
      isReady,
      isLoading: isShippingPending || isPayoutPending
    };
  }, [shipping_options, payout_account, isShippingPending, isPayoutPending]);
}
