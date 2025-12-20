/**
 * Event list component for displaying multiple events
 */

import { Grid, Box } from '@radix-ui/themes';
import { EventCard } from './EventCard';
import { Event, EventMetadata } from '../../types';

interface EventListProps {
  events: Event[];
  metadataMap?: Map<string, EventMetadata>;
}

export function EventList({ events, metadataMap }: EventListProps) {
  if (events.length === 0) {
    return (
      <Box py="9" style={{ textAlign: 'center' }}>
        <p>No events found</p>
      </Box>
    );
  }

  return (
    <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
      {events.map((event) => (
        <EventCard
          key={String(event.id)}
          event={event}
          metadata={metadataMap?.get(String(event.id))}
        />
      ))}
    </Grid>
  );
}

