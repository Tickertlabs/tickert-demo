/**
 * Query functions for events and tickets
 */

import { SuiClient } from '@mysten/sui/client';
import { PACKAGE_ID } from './contracts';

export interface EventData {
  id: string;
  organizer: string;
  metadata_url: string; // Walrus URL for image and description
  title: string;
  category: string;
  location_name: string;
  location_address: string;
  location_private: boolean;
  encrypted_location_url: string;
  location_encryption_key_id: string;
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
 * Check if an address is whitelisted for an event
 */
export async function isAddressWhitelisted(
  client: SuiClient,
  eventId: string,
  address: string
): Promise<boolean> {
  try {
    const result = await client.devInspectTransactionBlock({
      sender: address,
      transactionBlock: {
        kind: 'moveCall',
        data: {
          packageId: PACKAGE_ID,
          module: 'event',
          function: 'is_whitelisted_public',
          arguments: [eventId, address],
          typeArguments: [],
        },
      },
    });

    if (result.results && result.results[0]) {
      const returnValue = result.results[0].returnValues;
      if (returnValue && returnValue[0]) {
        const value = returnValue[0][1];
        // Decode the boolean value
        return value === '01' || value === '1';
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }
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
 * Query all events organized by an address
 * Note: Events are now shared objects, so we need to query by organizer field
 * This requires an indexer or GraphQL query in production.
 * For now, this is a placeholder that would need indexer support.
 */
export async function queryOwnedEvents(
  client: SuiClient,
  organizer: string
): Promise<EventData[]> {
  try {
    // Since events are shared objects, we can't use getOwnedObjects
    // In production, use an indexer service to query by organizer field
    // For now, return empty array - this needs to be implemented with indexer
    console.warn('queryOwnedEvents: Events are shared objects. Use indexer to query by organizer field.');
    
    // TODO: Implement with indexer API
    // Example: GET /api/events?organizer=${organizer}
    return [];
  } catch (error) {
    console.error('Error querying events by organizer:', error);
    return [];
  }
}

