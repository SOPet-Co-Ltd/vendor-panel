import { ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text } from '@medusajs/ui';
import { Link } from 'react-router-dom';

import { useCreateStripeOnboarding } from '../../../hooks/api';
import type { PayoutAccountStatus } from '../stripe-connect';

export const Connected = ({ status }: { status: PayoutAccountStatus }) => {
  const { mutateAsync, isPending } = useCreateStripeOnboarding();

  const hostname = window.location.href;

  const handleOnboarding = async () => {
    try {
      const { payout_account } = await mutateAsync({
        context: {
          refresh_url: hostname,
          return_url: hostname
        }
      });
      window.location.replace(payout_account.onboarding.data.url);
    } catch {
      window.location.reload();
    }
  };

  if (status === 'active') {
    return (
      <div className="my-32 flex max-w-md flex-col items-center justify-center text-center">
        <Heading
          level="h2"
          className="mt-4"
        >
          Your Stripe Account is ready
        </Heading>
        <Text
          className="mt-2 text-ui-fg-subtle"
          size="small"
        >
          You will receive payouts according to the marketplace schedule.
        </Text>
        <Link
          to="https://dashboard.stripe.com/payments"
          target="_blank"
        >
          <Button className="mt-6">Go to Stripe</Button>
        </Link>
      </div>
    );
  }

  if (status === 'disabled') {
    return (
      <div className="my-32 flex max-w-md flex-col items-center justify-center text-center">
        <ExclamationCircle />
        <Heading
          level="h2"
          className="mt-4"
        >
          Payout account disabled
        </Heading>
        <Text
          className="mt-2 text-ui-fg-subtle"
          size="small"
        >
          Your Stripe payout account is currently disabled. You may need to contact support or
          complete Stripe onboarding again to receive payouts.
        </Text>
        <Button
          isLoading={isPending}
          className="mt-6"
          onClick={() => handleOnboarding()}
        >
          Try Stripe onboarding again
        </Button>
      </div>
    );
  }

  return (
    <div className="my-32 flex max-w-md flex-col items-center justify-center text-center">
      <ExclamationCircle />
      <Heading
        level="h2"
        className="mt-4"
      >
        Complete Stripe onboarding to receive payouts
      </Heading>
      <Text
        className="mt-2 text-ui-fg-subtle"
        size="small"
      >
        You have started setup but have not finished. Until you complete Stripe onboarding, your
        payout account is not active and the marketplace cannot send you payouts for your sales.
      </Text>
      <Text
        className="mt-2 text-ui-fg-subtle"
        size="small"
      >
        On Stripe's page you will add your business details and bank account and complete any
        verification they require. Click the button below to open the onboarding page and finish the
        steps.
      </Text>
      <Button
        isLoading={isPending}
        className="mt-6"
        onClick={() => handleOnboarding()}
      >
        Continue to Stripe onboarding
      </Button>
    </div>
  );
};
