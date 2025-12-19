/**
 * Ticket detail page with QR code and encrypted metadata
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Container, Heading, Text, Box, Card, Flex, Button } from '@radix-ui/themes';
import { queryTicket } from '../../lib/sui/queries';
import { QRCode } from '../../components/ticket/QRCode';
import { Ticket, TicketMetadata } from '../../types';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [metadata] = useState<TicketMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      if (!id) return;

      try {
        const ticketData = await queryTicket(client, id);
        if (ticketData) {
          setTicket(ticketData);
        }
      } catch (error) {
        console.error('Error loading ticket:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [id, client]);

  const handleDecrypt = async () => {
    if (!ticket || !currentAccount) return;

    setDecrypting(true);
    try {
      // TODO: Implement decryption
      // This requires the encryption key which should be tied to the ticket holder
      // For MVP, we'll show a placeholder
      console.log('Decryption not yet fully implemented');
    } catch (error) {
      console.error('Error decrypting metadata:', error);
    } finally {
      setDecrypting(false);
    }
  };

  if (loading) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <p>Loading ticket...</p>
        </Box>
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <p>Ticket not found</p>
        </Box>
      </Container>
    );
  }

  const mintDate = new Date(Number(ticket.mint_time));
  const statusLabels: Record<string, string> = {
    '0': 'Valid',
    '1': 'Used',
    '2': 'Cancelled',
  };

  const isOwner = currentAccount?.address === ticket.holder;

  return (
    <Container size="4" py="5">
      <Card>
        <Heading size="8" mb="3">
          Ticket #{ticket.id.slice(0, 8)}
        </Heading>

        <Flex direction="column" gap="3" mb="5">
          <Box>
            <Text weight="bold">Event ID:</Text>
            <Text ml="2">{ticket.event_id}</Text>
          </Box>

          <Box>
            <Text weight="bold">Status:</Text>
            <Text ml="2">{statusLabels[ticket.status] || 'Unknown'}</Text>
          </Box>

          <Box>
            <Text weight="bold">Minted:</Text>
            <Text ml="2">{mintDate.toLocaleString()}</Text>
          </Box>

          <Box>
            <Text weight="bold">Holder:</Text>
            <Text ml="2">{ticket.holder}</Text>
          </Box>
        </Flex>

        {isOwner && (
          <Box mb="5">
            <QRCode value={ticket.id} />
            <Text size="2" color="gray" style={{ textAlign: 'center', display: 'block', marginTop: '1rem' }}>
              Show this QR code at the event for entry
            </Text>
          </Box>
        )}

        {isOwner && ticket.status === '0' && (
          <Box>
            <Button onClick={handleDecrypt} disabled={decrypting} mb="3">
              {decrypting ? 'Decrypting...' : 'View Encrypted Details'}
            </Button>

            {metadata && (
              <Box mt="3">
                <Heading size="4" mb="2">Event Details</Heading>
                {metadata.location && (
                  <Box mb="2">
                    <Text weight="bold">Location:</Text>
                    <Text ml="2">
                      {metadata.location.name} - {metadata.location.address}
                    </Text>
                  </Box>
                )}
                {metadata.accessLink && (
                  <Box mb="2">
                    <Text weight="bold">Access Link:</Text>
                    <Text ml="2">
                      <a href={metadata.accessLink} target="_blank" rel="noopener noreferrer">
                        {metadata.accessLink}
                      </a>
                    </Text>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Card>
    </Container>
  );
}

