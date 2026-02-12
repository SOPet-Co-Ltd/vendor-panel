import { ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text } from '@medusajs/ui';

import { useCreateStripeAccount } from '../../../hooks/api';

export const NotConnected = () => {
  const { mutateAsync, isPending } = useCreateStripeAccount();

  return (
    <div className="my-32 flex max-w-md flex-col items-center justify-center text-center">
      <ExclamationCircle />
      <Heading
        level="h2"
        className="mt-4"
      >
        Not connected
      </Heading>
      <Text
        className="mt-2 text-ui-fg-subtle"
        size="small"
      >
        To get paid for your orders, you must connect your store to Stripe. The marketplace will
        send your earnings to the bank account you add in Stripe.
      </Text>
      <Text
        className="mt-2 text-ui-fg-subtle"
        size="small"
      >
        Click below to create your payout account; you will then complete Stripe's onboarding
        (business details and bank account).
      </Text>
      <Button
        isLoading={isPending}
        className="mt-6"
        onClick={() =>
          mutateAsync({
            context: {
              country: 'TH'
            }
          })
        }
      >
        Connect Stripe
      </Button>
    </div>
  );
};
