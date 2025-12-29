/**
 * Event detail page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction, useSignPersonalMessage } from '@mysten/dapp-kit';
import { Container, Heading, Text, Box, Card, Flex } from '@radix-ui/themes';
import { queryEvent } from '../../lib/sui/queries';
import { getEventMetadata, getImageUrl } from '../../lib/walrus/storage';
import { getWalrusClient } from '../../lib/walrus/client';
import { RegisterButton } from '../../components/event/RegisterButton';
import {
  buildMintTicketTransaction,
  getClockObjectId,
} from '../../lib/sui/transactions';
import { getSealClient, createSessionKey, getSessionKeyPersonalMessage, setSessionKeySignature } from '../../lib/seal/client';
import { encryptTicketMetadata, decryptLocationData, generateEncryptionId } from '../../lib/seal/encryption';
import { Event } from '../../types';
import type { SessionKey } from '../../lib/seal/client';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [event, setEvent] = useState<Event | null>(null);
  const [walrusMetadata, setWalrusMetadata] = useState<{ image?: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;

      try {
        const eventData = await queryEvent(client, id);
        if (eventData) {
          setEvent(eventData);
          // Load large metadata (image and description) from Walrus
          const walrusData = await getEventMetadata(eventData.metadata_url);
          setWalrusMetadata(walrusData);
        }
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id, client]);

  const handleRegister = async () => {
    if (!event || !id || !currentAccount) {
      alert('Please connect your wallet');
      return;
    }

    setRegistering(true);
    try {
      if (!event) return;

      // 1. Handle location decryption if private
      let ticketLocation: { name: string; address: string } | undefined;
      
      if (event.location_private && event.encrypted_location_url && event.location_encryption_key_id) {
        console.log('Location is private, decrypting with Seal...');
        try {
          // Initialize Seal client
          const sealClient = getSealClient({ suiClient: client });
          
          // Create session key for decryption
          const sessionKey = await createSessionKey(currentAccount.address, client, 1);
          const personalMessage = await getSessionKeyPersonalMessage(sessionKey);
          
          // Sign personal message
          await new Promise<void>((resolve, reject) => {
            signPersonalMessage(
              { message: personalMessage },
              {
                onSuccess: async ({ signature }) => {
                  try {
                    await setSessionKeySignature(sessionKey, signature);
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                },
                onError: (error) => {
                  console.error('Error signing session key:', error);
                  reject(error);
                },
              }
            );
          });
          
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
            id // Event object ID for seal_approve
          );
          
          if (decryptedLocation.location) {
            ticketLocation = decryptedLocation.location;
            console.log('Location decrypted successfully');
          }
        } catch (error) {
          console.error('Error decrypting location:', error);
          // Fallback to placeholder if decryption fails
          ticketLocation = {
            name: 'Location will be available after ticket purchase',
            address: 'Please check your ticket for location details',
          };
        }
      } else {
        // Location is public, use on-chain data
        ticketLocation = {
          name: event.location_name,
          address: event.location_address,
        };
      }

      // 2. Initialize Seal client and encrypt ticket metadata
      const sealClient = getSealClient({ suiClient: client });
      const ticketEncryptionId = generateEncryptionId(currentAccount.address);
      
      // 3. Prepare ticket metadata (location, access link, etc.)
      const ticketMetadata = {
        location: ticketLocation,
        accessLink: `https://tickert.app/events/${id}`,
        qrCode: id,
        additionalInfo: `Event: ${event.title}`,
      };

      // 4. Encrypt ticket metadata using Seal
      const encryptedMetadataBytes = await encryptTicketMetadata(
        sealClient,
        ticketMetadata,
        ticketEncryptionId
      );

      // 5. Upload encrypted metadata to Walrus
      const walrusClient = getWalrusClient();
      const encryptedMetadataBlob = new Blob([encryptedMetadataBytes], { type: 'application/octet-stream' });
      const encryptedMetadataBlobId = await walrusClient.uploadBlob(encryptedMetadataBlob);
      const encryptedMetadataUrl = encryptedMetadataBlobId;

      // 6. Build mint ticket transaction
      const clockId = getClockObjectId();
      const txb = buildMintTicketTransaction(
        {
          eventId: String(id),
          encryptedMetadataUrl,
        },
        String(id),
        clockId
      );

      // 7. Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: txb,
        },
        {
          onSuccess: (result) => {
            console.log('Ticket minted:', result);
            alert('Ticket purchased successfully!');
            navigate('/tickets');
            setRegistering(false);
          },
          onError: (error: any) => {
            console.error('Error registering:', error);
            alert(`Failed to register: ${error.message || 'Unknown error'}`);
            setRegistering(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Error in handleRegister:', error);
      alert(`Failed to register: ${error.message || 'Unknown error'}`);
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <p>Loading event...</p>
        </Box>
      </Container>
    );
  }

  if (!event || !walrusMetadata) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <p>Event not found</p>
        </Box>
      </Container>
    );
  }

  const startDate = new Date(Number(event.start_time));
  const endDate = new Date(Number(event.end_time));
  const sold = Number(event.sold);
  const capacity = Number(event.capacity);
  const imageUrl = getImageUrl(walrusMetadata.image);

  return (
    <Container size="4" py="5">
      <Card>
        {imageUrl && (
          <Box
            style={{
              width: '100%',
              height: '400px',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-2)',
              marginBottom: '2rem',
            }}
          />
        )}

        <Heading size="8" mb="3">
          {event.title}
        </Heading>

        <Text size="4" color="gray" mb="4">
          {walrusMetadata.description}
        </Text>

        <Flex direction="column" gap="3" mb="5">
          <Box>
            <Text weight="bold">Date & Time:</Text>
            <Text ml="2">
              {startDate.toLocaleString()} - {endDate.toLocaleTimeString()}
            </Text>
          </Box>

          <Box>
            <Text weight="bold">Location:</Text>
            {event.location_private ? (
              <Text ml="2" color="gray" style={{ fontStyle: 'italic' }}>
                Private - Location will be revealed after ticket purchase
              </Text>
            ) : (
              <Text ml="2">
                {event.location_name} - {event.location_address}
              </Text>
            )}
          </Box>

          <Box>
            <Text weight="bold">Category:</Text>
            <Text ml="2">{event.category}</Text>
          </Box>

          <Box>
            <Text weight="bold">Tickets:</Text>
            <Text ml="2">
              {sold} / {capacity} sold
            </Text>
          </Box>
        </Flex>

        <RegisterButton
          eventId={String(event.id)}
          price={event.price}
          onRegister={handleRegister}
          isLoading={registering}
          disabled={sold >= capacity}
        />
      </Card>
    </Container>
  );
}

