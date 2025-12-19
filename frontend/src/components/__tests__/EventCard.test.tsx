/**
 * Basic test file structure for EventCard component
 * Note: Requires testing library setup (Jest, Vitest, etc.)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '../event/EventCard';
import { Event, EventMetadata } from '../../types';

describe('EventCard', () => {
  const mockEvent: Event = {
    id: '0x123',
    organizer: '0xabc',
    metadata_url: 'https://walrus.xyz/metadata',
    capacity: '100',
    price: '1000000000',
    sold: '50',
    status: '1',
    start_time: '1000000000000',
    end_time: '1000000001000',
    created_at: '1000000000000',
    requires_approval: false,
    is_public: true,
  };

  const mockMetadata: EventMetadata = {
    title: 'Test Event',
    description: 'Test Description',
    location: {
      name: 'Test Venue',
      address: '123 Test St',
    },
    category: 'Technology',
  };

  it('renders event title', () => {
    render(<EventCard event={mockEvent} metadata={mockMetadata} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('displays ticket count', () => {
    render(<EventCard event={mockEvent} metadata={mockMetadata} />);
    expect(screen.getByText(/50 \/ 100 tickets sold/)).toBeInTheDocument();
  });
});

