/**
 * Public events listing page
 */

import { useEffect, useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { Container, Heading, Box } from '@radix-ui/themes';
import { EventList } from '../../components/event/EventList';
import { queryPublicEvents } from '../../lib/sui/queries';
import { getEventMetadata } from '../../lib/walrus/storage';
import { Event } from '../../types';

export function EventsPage() {
  const client = useSuiClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [imageMap, setImageMap] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        // Query all public active events using GraphQL
        const publicEvents = await queryPublicEvents(client);
        setEvents(publicEvents);

        // Load images from Walrus for each event
        const imagePromises = publicEvents.map(async (event) => {
          try {
            const walrusMetadata = await getEventMetadata(event.metadata_url);
            return [String(event.id), walrusMetadata.image || ''] as [string, string];
          } catch (error) {
            console.error(`Error loading image for event ${String(event.id)}:`, error);
            return [String(event.id), ''] as [string, string];
          }
        });

        const imageResults = await Promise.all(imagePromises);
        const newImageMap = new Map(imageResults);
        setImageMap(newImageMap);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
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
      <EventList events={events} imageMap={imageMap} />
    </Container>
  );
}

