/**
 * Event list component for displaying multiple events
 */

import { Grid, Box } from '@radix-ui/themes';
import { EventCard } from './EventCard';
import { Event } from '../../types';

interface EventListProps {
  events: Event[];
  imageMap?: Map<string, string>; // Map of event ID to image blob ID from Walrus
  linkPath?: (eventId: string) => string; // Optional function to generate link path for each event
}

export function EventList({ events, imageMap, linkPath }: EventListProps) {
  if (events.length === 0) {
    return (
      <Box py="9" style={{ textAlign: 'center' }}>
        <p>No events found</p>
      </Box>
    );
  }

  return (
    <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
      {events.map((event) => {
        const eventId = String(event.id);
        const customLinkPath = linkPath ? linkPath(eventId) : undefined;
        
        return (
          <EventCard
            key={eventId}
            event={event}
            imageUrl={imageMap?.get(eventId)}
            linkPath={customLinkPath}
          />
        );
      })}
    </Grid>
  );
}

