/**
 * Public events listing page
 */

import { useEffect, useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { Container, Heading, Box } from '@radix-ui/themes';
import { EventList } from '../../components/event/EventList';
import { queryOwnedEvents } from '../../lib/sui/queries';
import { getEventMetadata } from '../../lib/walrus/storage';
import { Event, EventMetadata } from '../../types';

export function EventsPage() {
  const client = useSuiClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [metadataMap, setMetadataMap] = useState<Map<string, EventMetadata>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        // TODO: Replace with indexer API call for public events
        // For now, this is a placeholder
        // In production, use: GET /api/events?is_public=true&status=1
        setLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        setLoading(false);
      }
    }

    loadEvents();
  }, [client]);

  if (loading) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <p>Loading events...</p>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="4" py="5">
      <Heading size="8" mb="5">
        Upcoming Events
      </Heading>
      <EventList events={events} metadataMap={metadataMap} />
    </Container>
  );
}

