/**
 * Event list component for displaying multiple events
 */

import { Grid, Box } from '@radix-ui/themes';
import { EventCard } from './EventCard';
import { Event } from '../../types';

interface EventListProps {
  events: Event[];
  imageMap?: Map<string, string>; // Map of event ID to image blob ID from Walrus
}

export function EventList({ events, imageMap }: EventListProps) {
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
          imageUrl={imageMap?.get(String(event.id))}
        />
      ))}
    </Grid>
  );
}

