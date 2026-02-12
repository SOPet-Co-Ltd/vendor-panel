import { Container, Heading, Table, Text } from '@medusajs/ui';
import { format } from 'date-fns';

import { useStripeAccount, useVendorPayouts } from '../../hooks/api';
import { Connected } from './components/connected';
import { NotConnected } from './components/not-connected';
import { Status } from './components/status';

export type PayoutAccountStatus = 'pending' | 'active' | 'disabled' | 'not connected';

const getStatus = (payout_account: any): PayoutAccountStatus => {
  if (!payout_account) return 'not connected';
  const status = payout_account.status;
  if (status === 'active' || status === 'pending' || status === 'disabled') return status;
  return 'pending';
};

function formatPayoutAmount(amount: number, currencyCode: string): string {
  const value = Number(amount);
  const displayAmount = (value / 100).toFixed(2);
  return `${Number(displayAmount).toLocaleString()} ${currencyCode.toUpperCase()}`;
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM, yyyy');
  } catch {
    return '—';
  }
}

export const StripeConnect = () => {
  const { payout_account } = useStripeAccount();
  const { payouts, isLoading: payoutsLoading, isError: payoutsError } = useVendorPayouts();

  return (
    <div className="flex flex-col gap-6">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Stripe Connect</Heading>
            <Text
              className="text-ui-fg-subtle"
              size="small"
            >
              Connect Stripe to receive automatic payouts from the marketplace
            </Text>
          </div>
          <div>
            <Status status={getStatus(payout_account)} />
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-4">
          {!payout_account ? <NotConnected /> : <Connected status={getStatus(payout_account)} />}
        </div>
      </Container>

      {payout_account && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading
              level="h2"
              className="mb-4"
            >
              Account details
            </Heading>
          </div>
          <div className="grid grid-cols-2 px-6 py-4 text-ui-fg-subtle">
            <Text
              size="small"
              leading="compact"
              weight="plus"
            >
              Status
            </Text>
            <Text
              size="small"
              leading="compact"
            >
              {payout_account.status ?? '—'}
            </Text>
          </div>
          <div className="grid grid-cols-2 px-6 py-4 text-ui-fg-subtle">
            <Text
              size="small"
              leading="compact"
              weight="plus"
            >
              Stripe account ID
            </Text>
            <Text
              size="small"
              leading="compact"
            >
              {payout_account.reference_id ?? '—'}
            </Text>
          </div>
          <div className="grid grid-cols-2 px-6 py-4 text-ui-fg-subtle">
            <Text
              size="small"
              leading="compact"
              weight="plus"
            >
              Created at
            </Text>
            <Text
              size="small"
              leading="compact"
            >
              {formatDate(payout_account.created_at)}
            </Text>
          </div>
          <div className="grid grid-cols-2 px-6 py-4 text-ui-fg-subtle">
            <Text
              size="small"
              leading="compact"
              weight="plus"
            >
              Updated at
            </Text>
            <Text
              size="small"
              leading="compact"
            >
              {formatDate(payout_account.updated_at)}
            </Text>
          </div>
        </Container>
      )}

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading
            level="h2"
            className="mb-4"
          >
            Recent payouts
          </Heading>
        </div>
        <div className="px-6 py-4">
          {payoutsError && (
            <Text
              size="small"
              className="text-ui-fg-error"
            >
              Failed to load payouts. Please try again later.
            </Text>
          )}
          {!payoutsError && payoutsLoading && (
            <Text
              size="small"
              className="text-ui-fg-subtle"
            >
              Loading…
            </Text>
          )}
          {!payoutsError && !payoutsLoading && payouts.length === 0 && (
            <Text
              size="small"
              className="text-ui-fg-subtle"
            >
              No payouts yet.
            </Text>
          )}
          {!payoutsError && !payoutsLoading && payouts.length > 0 && (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Currency</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payouts.map(payout => (
                  <Table.Row key={payout.id}>
                    <Table.Cell>{formatDate(payout.created_at)}</Table.Cell>
                    <Table.Cell>
                      {formatPayoutAmount(payout.amount, payout.currency_code)}
                    </Table.Cell>
                    <Table.Cell>{payout.currency_code?.toUpperCase() ?? '—'}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>
    </div>
  );
};
