/**
 * Event card component for displaying event preview
 */

import { Card, Heading, Text, Box, Flex } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { Event, EventMetadata } from '../../types';

interface EventCardProps {
  event: Event;
  metadata?: EventMetadata;
}

export function EventCard({ event, metadata }: EventCardProps) {
  const startDate = new Date(Number(event.start_time));
  const sold = Number(event.sold);
  const capacity = Number(event.capacity);
  const price = Number(event.price) / 1_000_000_000; // Convert MIST to SUI

  return (
    <Card>
      <Link
        to={`/events/${event.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {metadata?.image && (
          <Box
            style={{
              width: '100%',
              height: '200px',
              backgroundImage: `url(${metadata.image})`,
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

