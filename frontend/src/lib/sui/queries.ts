/**
 * Query functions for events and tickets
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
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
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::event::is_whitelisted_public`,
      arguments: [tx.pure.id(eventId), tx.pure.address(address)],
    });

    const txBytes = await tx.build({ client, onlyTransactionKind: true });
    
    const result = await client.devInspectTransactionBlock({
      sender: address,
      transactionBlock: txBytes,
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
 * Since events are shared objects, we use Sui GraphQL API to query by organizer field
 */
export async function queryOwnedEvents(
  client: SuiClient,
  organizer: string
): Promise<EventData[]> {
  try {
    // Get GraphQL endpoint from environment or derive from RPC URL
    const graphqlEndpoint = getGraphQLEndpoint(client);
    
    if (!graphqlEndpoint) {
      console.warn('GraphQL endpoint not available. Cannot query shared events by organizer.');
      return [];
    }

    // GraphQL query to get all Event objects (shared objects)
    // Note: Sui GraphQL API doesn't support field-based filtering,
    // so we fetch all events and filter by organizer client-side
    // Try without owner filter first, as shared objects might not need it
    const query = `
      query ($packageId: String!) {
        objects(
          filter: {
            type: $packageId
          }
          first: 50
        ) {
          nodes {
            address
            asMoveObject {
              contents {
                json
              }
            }
          }
        }
      }
    `;

    const variables = {
      packageId: `${PACKAGE_ID}::event::Event`,
    };

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      // Log detailed error information
      result.errors.forEach((error: any) => {
        console.error('GraphQL error message:', error.message);
        console.error('GraphQL error locations:', error.locations);
        console.error('GraphQL error extensions:', error.extensions);
      });
      return [];
    }

    // Filter events by organizer and transform to EventData
    const events: EventData[] = [];
    
    if (result.data?.objects?.nodes) {
      for (const node of result.data.objects.nodes) {
        const contents = node.asMoveObject?.contents?.json;
        if (contents && contents.organizer === organizer) {
          // Use address from node (GraphQL returns address instead of id)
          const eventId = typeof node.address === 'string' 
            ? node.address 
            : (contents.id || String(node.address || ''));
          
          // Remove id from contents if it exists to prevent override
          const { id: _, ...fieldsWithoutId } = contents;
          
          events.push({
            ...fieldsWithoutId,
            id: eventId,
          } as EventData);
        }
      }
    }

    return events;
  } catch (error) {
    console.error('Error querying events by organizer:', error);
    // Fallback: return empty array instead of throwing
    return [];
  }
}

/**
 * Get GraphQL endpoint from SuiClient RPC URL
 * Derives GraphQL endpoint from the RPC endpoint
 * 
 * Sui GraphQL API endpoints:
 * - Testnet: https://sui-testnet.mystenlabs.com/graphql
 * - Mainnet: https://sui-mainnet.mystenlabs.com/graphql
 * - Devnet: https://sui-devnet.mystenlabs.com/graphql
 */
function getGraphQLEndpoint(client: SuiClient): string | null {
  // Try to get from environment variable first
  const envEndpoint = import.meta.env.VITE_SUI_GRAPHQL_ENDPOINT;
  if (envEndpoint) {
    return envEndpoint;
  }

  // Try to derive from client's RPC URL
  // Access the internal connection URL if available
  const clientUrl = (client as any).connection?.fullnode || 
                   (client as any).url || 
                   (client as any).rpcUrl;
  
  if (typeof clientUrl === 'string') {
    if (clientUrl.includes('testnet')) {
      return 'https://graphql.testnet.sui.io/graphql';
    } else if (clientUrl.includes('mainnet')) {
      return 'https://graphql.mainnet.sui.io/graphql';
    } else if (clientUrl.includes('devnet')) {
      return 'https://graphql.devnet.sui.io/graphql';
    }
  }

  // Default to testnet if we can't determine
  // This can be overridden via VITE_SUI_GRAPHQL_ENDPOINT environment variable
  return 'https://graphql.testnet.sui.io/graphql';
}

