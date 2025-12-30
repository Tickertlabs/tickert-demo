/**
 * Ticket detail page with QR code and encrypted metadata
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSuiClient, useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { Container, Heading, Text, Box, Card, Flex, Button } from '@radix-ui/themes';
import { queryTicket, queryEvent } from '../../lib/sui/queries';
import { QRCode } from '../../components/ticket/QRCode';
import { Ticket, Event } from '../../types';
import { getWalrusClient } from '../../lib/walrus/client';
import { getSealClient, createSessionKey, getSessionKeyPersonalMessage, setSessionKeySignature } from '../../lib/seal/client';
import { decryptLocationData } from '../../lib/seal/encryption';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [location, setLocation] = useState<{ name: string; address: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      if (!id) return;

      try {
        const ticketData = await queryTicket(client, id);
        if (ticketData) {
          setTicket(ticketData);
          
          // Load event data to get location information
          const eventData = await queryEvent(client, ticketData.event_id);
          if (eventData) {
            // Convert location_private to boolean if it's a string
            const locationPrivate = typeof eventData.location_private === 'boolean' 
              ? eventData.location_private 
              : eventData.location_private === 'true' || eventData.location_private === true;
            
            const eventWithBoolean = {
              ...eventData,
              location_private: locationPrivate,
            } as Event;
            
            setEvent(eventWithBoolean);
            
            // If location is private, we'll decrypt it when user clicks decrypt button
            // If location is public, show it immediately
            if (!locationPrivate) {
              setLocation({
                name: eventData.location_name,
                address: eventData.location_address,
              });
            }
          }
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
    if (!ticket || !event || !currentAccount) return;

    setDecrypting(true);
    try {
      // If location is private, decrypt it
      if (event.location_private && event.encrypted_location_url && event.location_encryption_key_id) {
        // Initialize Seal client
        const sealClient = getSealClient({ suiClient: client });
        
        // Create session key for decryption
        const sessionKey = await createSessionKey(currentAccount.address, client, 1);
        const personalMessage = await getSessionKeyPersonalMessage(sessionKey);
        
        // Sign personal message
        const result = await signPersonalMessage({
          message: personalMessage,
        });
        await setSessionKeySignature(sessionKey, result.signature);

        // Fetch encrypted location from Walrus
        const walrusClient = getWalrusClient();
        const encryptedLocationBlob = await walrusClient.getBlob(event.encrypted_location_url);
        const encryptedLocationBytes = new Uint8Array(await encryptedLocationBlob.arrayBuffer());
        
        // Decrypt location using Seal
        const decryptedLocation = await decryptLocationData(
          sealClient,
          encryptedLocationBytes,
          event.location_encryption_key_id,
          client,
          sessionKey,
          event.id // Event object ID for seal_approve
        );
        
        if (decryptedLocation.location) {
          setLocation(decryptedLocation.location);
        }
      }
    } catch (error) {
      console.error('Error decrypting:', error);
      alert('Failed to decrypt location. Make sure you are the ticket owner and have purchased a ticket.');
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
  const isValidTicket = Number(ticket.status) === 0;
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

        {isOwner && isValidTicket && (
          <Box>
            <Heading size="4" mb="3">Event Location</Heading>
            
            {!event ? (
              <Text color="gray">Loading location information...</Text>
            ) : (() => {
              // Convert location_private to boolean if needed
              const locationPrivate = typeof event.location_private === 'boolean' 
                ? event.location_private 
                : String(event.location_private) === 'true';
              
              // Private location and not decrypted yet
              if (locationPrivate && !location) {
                return (
                  <Box mb="3">
                    <Text color="gray" mb="2" style={{ display: 'block' }}>
                      This event has a private location. Click the button below to decrypt and view it.
                    </Text>
                    <Button onClick={handleDecrypt} disabled={decrypting} size="3">
                      {decrypting ? 'Decrypting Location...' : 'View Event Location'}
                    </Button>
                  </Box>
                );
              }
              
              // Location decrypted or public
              if (location) {
                return (
                  <Box mb="3">
                    <Text weight="bold" mb="1" style={{ display: 'block' }}>Location:</Text>
                    <Text ml="2">
                      {location.name} - {location.address}
                    </Text>
                  </Box>
                );
              }
              
              // Public location
              if (!locationPrivate) {
                return (
                  <Box mb="3">
                    <Text weight="bold" mb="1" style={{ display: 'block' }}>Location:</Text>
                    <Text ml="2">
                      {event.location_name} - {event.location_address}
                    </Text>
                  </Box>
                );
              }
              
              return null;
            })()}

          </Box>
        )}
      </Card>
    </Container>
  );
}

