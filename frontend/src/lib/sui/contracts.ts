/**
 * Contract interaction helpers
 * Provides utilities for interacting with Tickert smart contracts
 */

import { SuiClient } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';

export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x8e5005145e6c16c8820ace59c30ccb8cd3d00ba328622fed02738182758c0d16';

/**
 * Get event object from blockchain
 */
export async function getEvent(
  client: SuiClient,
  eventId: string
): Promise<any> {
  const event = await client.getObject({
    id: eventId,
    options: {
      showContent: true,
      showType: true,
    },
  });

  if (event.data?.content && 'fields' in event.data.content) {
    return event.data.content.fields;
  }

  throw new Error('Event not found');
}

/**
 * Get ticket object from blockchain
 */
export async function getTicket(
  client: SuiClient,
  ticketId: string
): Promise<any> {
  const ticket = await client.getObject({
    id: ticketId,
    options: {
      showContent: true,
      showType: true,
    },
  });

  if (ticket.data?.content && 'fields' in ticket.data.content) {
    return ticket.data.content.fields;
  }

  throw new Error('Ticket not found');
}

/**
 * Get all tickets owned by an address
 */
export async function getOwnedTickets(
  client: SuiClient,
  owner: string
): Promise<any[]> {
  const tickets = await client.getOwnedObjects({
    owner,
    filter: {
      StructType: `${PACKAGE_ID}::ticket::Ticket`,
    },
    options: {
      showContent: true,
      showType: true,
    },
  });

  return tickets.data.map((ticket) => {
    if (ticket.data?.content && 'fields' in ticket.data.content) {
      return {
        id: ticket.data.objectId,
        ...ticket.data.content.fields,
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Get all events owned by an address (organizer's events)
 */
export async function getOwnedEvents(
  client: SuiClient,
  owner: string
): Promise<any[]> {
  const events = await client.getOwnedObjects({
    owner,
    filter: {
      StructType: `${PACKAGE_ID}::event::Event`,
    },
    options: {
      showContent: true,
      showType: true,
    },
  });

  return events.data.map((event) => {
    if (event.data?.content && 'fields' in event.data.content) {
      return {
        id: event.data.objectId,
        ...event.data.content.fields,
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Get all public active events
 * Note: This is a simplified version. In production, use an indexer for better performance.
 */
export async function getPublicEvents(
  client: SuiClient
): Promise<any[]> {
  // This would typically use an indexer service
  // For now, this is a placeholder that would need to be implemented
  // with a proper event registry or indexer
  throw new Error('Use indexer service for public events listing');
}

