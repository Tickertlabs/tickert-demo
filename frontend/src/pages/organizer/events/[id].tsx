/**
 * Organizer's event detail and management page
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Container, Heading, Text, Box, Card, Flex, Button } from '@radix-ui/themes';
import { queryEvent } from '../../../lib/sui/queries.js';
import { getEventMetadata } from '../../../lib/walrus/storage.js';
import { Event, EventMetadata } from '../../../types/index.js';

export function OrganizerEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useSuiClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [metadata, setMetadata] = useState<EventMetadata | null>(null);
  const [loading, setLoading] = useState(true);

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
  const sold = Number(event.sold);
  const capacity = Number(event.capacity);

  return (
    <Container size="4" py="5">
      <Card>
        <Heading size="8" mb="3">
          {metadata.title}
        </Heading>

        <Flex direction="column" gap="3" mb="5">
          <Box>
            <Text weight="bold">Status:</Text>
            <Text ml="2">{event.status === '1' ? 'Active' : 'Inactive'}</Text>
          </Box>

          <Box>
            <Text weight="bold">Tickets Sold:</Text>
            <Text ml="2">
              {sold} / {capacity} ({((sold / capacity) * 100).toFixed(1)}%)
            </Text>
          </Box>

          <Box>
            <Text weight="bold">Start Date:</Text>
            <Text ml="2">{startDate.toLocaleString()}</Text>
          </Box>
        </Flex>

        <Flex gap="3">
          <Button variant="soft">Edit Event</Button>
          <Button variant="soft">View Analytics</Button>
          <Button variant="soft" color="red">
            Cancel Event
          </Button>
        </Flex>
      </Card>
    </Container>
  );
}

