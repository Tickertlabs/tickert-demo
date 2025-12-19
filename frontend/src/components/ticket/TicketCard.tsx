/**
 * Ticket card component for displaying ticket preview
 */

import { Card, Heading, Text, Flex } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { Ticket } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const mintDate = new Date(Number(ticket.mint_time));
  const statusLabels: Record<string, string> = {
    '0': 'Valid',
    '1': 'Used',
    '2': 'Cancelled',
  };

  return (
    <Card>
      <Link
        to={`/tickets/${ticket.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <Heading size="4">Ticket #{ticket.id.slice(0, 8)}</Heading>
        <Text size="2" color="gray" mt="2">
          Event ID: {ticket.event_id.slice(0, 8)}...
        </Text>
        <Text size="2" color="gray" mt="1">
          Minted: {mintDate.toLocaleDateString()}
        </Text>
        <Flex justify="between" mt="3">
          <Text size="2" weight="bold">
            Status: {statusLabels[ticket.status] || 'Unknown'}
          </Text>
        </Flex>
      </Link>
    </Card>
  );
}

