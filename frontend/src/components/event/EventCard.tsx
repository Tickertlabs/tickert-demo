/**
 * Event card component for displaying event preview
 */

import { Card, Heading, Text, Box, Flex } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { Event, EventMetadata } from '../../types';
import { getImageUrl } from '../../lib/walrus/storage';

interface EventCardProps {
  event: Event;
  metadata?: EventMetadata;
}

export function EventCard({ event, metadata }: EventCardProps) {
  const startDate = new Date(Number(event.start_time));
  const sold = Number(event.sold);
  const capacity = Number(event.capacity);
  const price = Number(event.price) / 1_000_000_000; // Convert MIST to SUI

  // Ensure event.id is a string
  // Handle all possible cases where id might not be a string
  let eventId: string;
  if (typeof event.id === 'string') {
    eventId = event.id;
  } else if (event.id && typeof event.id === 'object') {
    // Try to extract string ID from object
    const obj = event.id as any;
    eventId = String(obj.id || obj.objectId || obj.value || JSON.stringify(obj));
  } else {
    eventId = String(event.id || '');
  }
  
  // Final safety check - if still not a valid string, use empty string
  if (!eventId || eventId === '[object Object]' || eventId === 'undefined' || eventId === 'null') {
    console.error('EventCard: Invalid event.id:', event.id, 'event:', event);
    eventId = '';
  }

  const imageUrl = getImageUrl(metadata?.image);

  return (
    <Card>
      <Link
        to={`/events/${eventId}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {imageUrl && (
          <Box
            style={{
              width: '100%',
              height: '200px',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-2)',
              marginBottom: '1rem',
            }}
          />
        )}
        <Heading size="4">{metadata?.title || 'Untitled Event'}</Heading>
        <Text size="2" color="gray" mt="2">
          {startDate.toLocaleDateString()} {startDate.toLocaleTimeString()}
        </Text>
        <Text size="2" color="gray" mt="1">
          {metadata?.location?.name || 'Location TBA'}
        </Text>
        <Flex justify="between" mt="3">
          <Text size="2">
            {sold} / {capacity} tickets sold
          </Text>
          <Text size="2" weight="bold">
            {price} SUI
          </Text>
        </Flex>
      </Link>
    </Card>
  );
}

