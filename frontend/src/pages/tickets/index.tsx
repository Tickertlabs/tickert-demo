/**
 * User's tickets listing page
 */

import { useEffect, useState } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Container, Heading, Box, Grid } from '@radix-ui/themes';
import { TicketCard } from '../../components/ticket/TicketCard';
import { queryOwnedTickets } from '../../lib/sui/queries';
import { Ticket } from '../../types';

export function TicketsPage() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      try {
        const ownedTickets = await queryOwnedTickets(
          client,
          currentAccount.address
        );
        setTickets(ownedTickets);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [client, currentAccount]);

  if (loading) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <p>Loading tickets...</p>
        </Box>
      </Container>
    );
  }

  if (tickets.length === 0) {
    return (
      <Container size="4" py="9">
        <Heading size="8" mb="5">
          My Tickets
        </Heading>
        <Box style={{ textAlign: 'center' }}>
          <p>No tickets found</p>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="4" py="5">
      <Heading size="8" mb="5">
        My Tickets
      </Heading>
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </Grid>
    </Container>
  );
}

