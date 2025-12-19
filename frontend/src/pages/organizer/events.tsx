/**
 * Organizer's events listing page
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuiClient, useWallet } from '@mysten/dapp-kit';
import { Container, Heading, Button, Box } from '@radix-ui/themes';
import { EventList } from '../../components/event/EventList';
import { queryOwnedEvents } from '../../lib/sui/queries';
import { getEventMetadata } from '../../lib/walrus/storage';
import { Event, EventMetadata } from '../../types';

export function OrganizerEventsPage() {
  const navigate = useNavigate();
  const client = useSuiClient();
  const { currentAccount } = useWallet();
  const [events, setEvents] = useState<Event[]>([]);
  const [metadataMap, setMetadataMap] = useState<Map<string, EventMetadata>>(
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
        setEvents(ownedEvents);

        // Load metadata for each event
        const metadataPromises = ownedEvents.map(async (event) => {
          try {
            const metadata = await getEventMetadata(event.metadata_url);
            return [event.id, metadata] as [string, EventMetadata];
          } catch (error) {
            console.error(`Error loading metadata for event ${event.id}:`, error);
            return null;
          }
        });

        const metadataResults = await Promise.all(metadataPromises);
        const newMetadataMap = new Map(
          metadataResults.filter((r): r is [string, EventMetadata] => r !== null)
        );
        setMetadataMap(newMetadataMap);
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
      <EventList events={events} metadataMap={metadataMap} />
    </Container>
  );
}

