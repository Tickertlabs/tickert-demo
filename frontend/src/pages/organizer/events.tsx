/**
 * Organizer's events listing page
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Container, Heading, Button, Box } from '@radix-ui/themes';
import { EventList } from '../../components/event/EventList';
import { queryOwnedEvents } from '../../lib/sui/queries';
import { getEventMetadata } from '../../lib/walrus/storage';
import { Event } from '../../types';

export function OrganizerEventsPage() {
  const navigate = useNavigate();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [imageMap, setImageMap] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      try {
        const ownedEvents = await queryOwnedEvents(client, currentAccount.address);
        // Debug: log event structure
        if (ownedEvents.length > 0) {
          console.log('First event structure:', ownedEvents[0]);
          console.log('First event.id type:', typeof ownedEvents[0].id, ownedEvents[0].id);
        }
        setEvents(ownedEvents);

        // Load image from Walrus for each event (only image and description are stored there)
        const imagePromises = ownedEvents.map(async (event) => {
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
  }, [client, currentAccount]);

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
      <Box mb="5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading size="8">My Events</Heading>
        <Button onClick={() => navigate('/organizer/create')} size="3">
          Create Event
        </Button>
      </Box>
      <EventList events={events} imageMap={imageMap} />
    </Container>
  );
}

