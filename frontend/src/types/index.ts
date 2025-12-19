/**
 * Type definitions for Tickert platform
 */

export interface Event {
  id: string;
  organizer: string;
  metadata_url: string;
  capacity: string;
  price: string;
  sold: string;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
  requires_approval: boolean;
  is_public: boolean;
}

export interface EventMetadata {
  title: string;
  description: string;
  image?: string;
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string;
  tags?: string[];
  agenda?: Array<{
    time: string;
    title: string;
    speaker?: string;
  }>;
  speakers?: Array<{
    name: string;
    bio?: string;
    image?: string;
  }>;
  announcements?: string[];
  ics_calendar?: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  holder: string;
  mint_time: string;
  status: string;
  encrypted_metadata_url: string;
}

export interface TicketMetadata {
  location?: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  accessLink?: string;
  qrCode?: string;
  additionalInfo?: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  attendee: string;
  timestamp: string;
  verified: boolean;
}

