/**
 * Query functions for events and tickets
 */

import { SuiClient } from '@mysten/sui/client';
import { PACKAGE_ID } from './contracts';

export interface EventData {
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

export interface TicketData {
  id: string;
  event_id: string;
  holder: string;
  mint_time: string;
  status: string;
  encrypted_metadata_url: string;
}

/**
 * Query event by ID
 */
export async function queryEvent(
  client: SuiClient,
  eventId: string
): Promise<EventData | null> {
  try {
    const object = await client.getObject({
      id: eventId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (
      object.data?.content &&
      'fields' in object.data.content &&
      object.data.content.type === `${PACKAGE_ID}::event::Event`
    ) {
      const fields = object.data.content.fields as any;
      // Ensure id is always a string
      let eventId: string;
      if (typeof object.data.objectId === 'string') {
        eventId = object.data.objectId;
      } else if (object.data.objectId && typeof object.data.objectId === 'object') {
        // Handle case where objectId might be an object
        eventId = String((object.data.objectId as any).id || (object.data.objectId as any).objectId || object.data.objectId);
      } else {
        eventId = String(object.data.objectId || '');
      }
      
      // Remove id from fields if it exists to prevent override
      const { id: _, ...fieldsWithoutId } = fields;
      
      return {
        ...fieldsWithoutId,
        id: eventId, // Always use objectId as string
      } as EventData;
    }

    return null;
  } catch (error) {
    console.error('Error querying event:', error);
    return null;
  }
}

/**
 * Query ticket by ID
 */
export async function queryTicket(
  client: SuiClient,
  ticketId: string
): Promise<TicketData | null> {
  try {
    const object = await client.getObject({
      id: ticketId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (
      object.data?.content &&
      'fields' in object.data.content &&
      object.data.content.type === `${PACKAGE_ID}::ticket::Ticket`
    ) {
      const fields = object.data.content.fields as any;
      const objectId = object.data.objectId;
      const ticketId = typeof objectId === 'string' ? objectId : String(objectId || '');
      
      // Remove id from fields if it exists to prevent override
      const { id: _, ...fieldsWithoutId } = fields;
      
      return {
        ...fieldsWithoutId,
        id: ticketId, // Always use objectId as string
      } as TicketData;
    }

    return null;
  } catch (error) {
    console.error('Error querying ticket:', error);
    return null;
  }
}

/**
 * Query all tickets owned by an address
 */
export async function queryOwnedTickets(
  client: SuiClient,
  owner: string
): Promise<TicketData[]> {
  try {
    const objects = await client.getOwnedObjects({
      owner,
      filter: {
        StructType: `${PACKAGE_ID}::ticket::Ticket`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    return objects.data
      .map((obj) => {
        if (
          obj.data?.content &&
          'fields' in obj.data.content &&
          obj.data.content.type === `${PACKAGE_ID}::ticket::Ticket`
        ) {
          const fields = obj.data.content.fields as any;
          const objectId = obj.data.objectId;
          const ticketId = typeof objectId === 'string' ? objectId : String(objectId || '');
          
          // Remove id from fields if it exists to prevent override
          const { id: _, ...fieldsWithoutId } = fields;
          
          return {
            ...fieldsWithoutId,
            id: ticketId, // Always use objectId as string
          } as TicketData;
        }
        return null;
      })
      .filter((ticket): ticket is TicketData => ticket !== null);
  } catch (error) {
    console.error('Error querying owned tickets:', error);
    return [];
  }
}

/**
 * Query all events owned by an address (organizer's events)
 */
export async function queryOwnedEvents(
  client: SuiClient,
  owner: string
): Promise<EventData[]> {
  try {
    const objects = await client.getOwnedObjects({
      owner,
      filter: {
        StructType: `${PACKAGE_ID}::event::Event`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    return objects.data
      .map((obj) => {
        if (
          obj.data?.content &&
          'fields' in obj.data.content &&
          obj.data.content.type === `${PACKAGE_ID}::event::Event`
        ) {
          const fields = obj.data.content.fields as any;
          // Ensure id is always a string
          // obj.data.objectId should be a string, but handle edge cases
          let eventId: string;
          if (typeof obj.data.objectId === 'string') {
            eventId = obj.data.objectId;
          } else if (obj.data.objectId && typeof obj.data.objectId === 'object') {
            // Handle case where objectId might be an object
            eventId = String((obj.data.objectId as any).id || (obj.data.objectId as any).objectId || obj.data.objectId);
          } else {
            eventId = String(obj.data.objectId || '');
          }
          
          // Remove id from fields if it exists to prevent override
          const { id: _, ...fieldsWithoutId } = fields;
          
          return {
            ...fieldsWithoutId,
            id: eventId, // Always use objectId as string
          } as EventData;
        }
        return null;
      })
      .filter((event): event is EventData => event !== null);
  } catch (error) {
    console.error('Error querying owned events:', error);
    return [];
  }
}

