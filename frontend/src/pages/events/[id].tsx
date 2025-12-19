/**
 * Event detail page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Container, Heading, Text, Box, Card, Flex } from '@radix-ui/themes';
import { queryEvent } from '../../lib/sui/queries';
import { getEventMetadata } from '../../lib/walrus/storage';
import { RegisterButton } from '../../components/event/RegisterButton';
import {
  buildMintTicketTransaction,
  getClockObjectId,
} from '../../lib/sui/transactions';
import { generateTicketKey, encryptTicketMetadata } from '../../lib/seal/encryption';
import { Event, EventMetadata } from '../../types';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [event, setEvent] = useState<Event | null>(null);
  const [metadata, setMetadata] = useState<EventMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;

      try {
        const eventData = await queryEvent(client, id);
        if (eventData) {
          setEvent(eventData);
          const metadataData = await getEventMetadata(eventData.metadata_url);
          setMetadata(metadataData);
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
      // 1. Generate ticket encryption key
      const keyId = await generateTicketKey();

      // 2. Prepare ticket metadata (encrypted location, access link, etc.)
      const ticketMetadata = {
        location: metadata?.location,
        accessLink: `https://tickert.app/events/${id}`,
        qrCode: id,
        additionalInfo: `Event: ${metadata?.title}`,
      };

      // 3. Encrypt ticket metadata
      const encryptedMetadata = await encryptTicketMetadata(ticketMetadata, keyId);

      // 4. Upload encrypted metadata to Walrus (or use Seal's storage)
      // For now, we'll store the encrypted string directly
      // In production, upload to Walrus and get URL
      const encryptedMetadataUrl = encryptedMetadata; // Placeholder

      // 5. Build mint ticket transaction
      const clockId = getClockObjectId();
      const txb = buildMintTicketTransaction(
        {
          eventId: id,
          encryptedMetadataUrl,
        },
        id,
        clockId
      );

      // 6. Sign and execute transaction
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

  if (!event || !metadata) {
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

  return (
    <Container size="4" py="5">
      <Card>
        {metadata.image && (
          <Box
            style={{
              width: '100%',
              height: '400px',
              backgroundImage: `url(${metadata.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-2)',
              marginBottom: '2rem',
            }}
          />
        )}

        <Heading size="8" mb="3">
          {metadata.title}
        </Heading>

        <Text size="4" color="gray" mb="4">
          {metadata.description}
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
            <Text ml="2">
              {metadata.location.name} - {metadata.location.address}
            </Text>
          </Box>

          <Box>
            <Text weight="bold">Category:</Text>
            <Text ml="2">{metadata.category}</Text>
          </Box>

          <Box>
            <Text weight="bold">Tickets:</Text>
            <Text ml="2">
              {sold} / {capacity} sold
            </Text>
          </Box>
        </Flex>

        <RegisterButton
          eventId={event.id}
          price={event.price}
          onRegister={handleRegister}
          isLoading={registering}
          disabled={sold >= capacity}
        />
      </Card>
    </Container>
  );
}

