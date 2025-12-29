/**
 * Walrus storage operations
 * Handles event metadata upload and retrieval
 */

import { getWalrusClient, getBlobUrl } from './client';

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

/**
 * Upload event metadata to Walrus
 * 
 * According to Walrus documentation (https://docs.wal.app/docs/usage/web-api):
 * - Uses PUT /v1/blobs endpoint on publisher service
 * - Returns blob ID that can be used to retrieve the blob
 * - Blob storage requires WAL token and SUI for payment
 * 
 * @param metadata - Event metadata to upload
 * @returns Walrus blob ID (can be used to construct aggregator URL)
 */
export async function uploadEventMetadata(
  metadata: EventMetadata
): Promise<string> {
  const client = getWalrusClient();
  const jsonString = JSON.stringify(metadata, null, 2);
  const blobId = await client.uploadBlob(jsonString);
  
  if (!blobId) {
    throw new Error('Failed to upload metadata to Walrus: No blob ID returned');
  }
  
  // Return blob ID - the full URL can be constructed as:
  // https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}
  return blobId;
}

/**
 * Upload image to Walrus
 * 
 * Uploads event images to Walrus blob storage.
 * Payment (WAL token + SUI) is handled automatically by the publisher service.
 * 
 * @param imageFile - Image file to upload
 * @returns Walrus blob ID (can be used to construct aggregator URL)
 */
export async function uploadImageToWalrus(
  imageFile: File | Blob
): Promise<string> {
  const client = getWalrusClient();
  const blobId = await client.uploadBlob(imageFile);
  
  if (!blobId) {
    throw new Error('Failed to upload image to Walrus: No blob ID returned');
  }
  
  // Return blob ID - the full URL can be constructed as:
  // https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}
  return blobId;
}

/**
 * Retrieve event metadata from Walrus
 * 
 * Supports both blob ID and full URL formats:
 * - Blob ID: "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk"
 * - Full URL: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk"
 * 
 * @param blobIdOrUrl - Blob ID or full aggregator URL
 * @param aggregatorUrl - Optional aggregator URL (only used if blobIdOrUrl is a blob ID)
 * @returns Event metadata
 */
export async function getEventMetadata(
  blobIdOrUrl: string,
  aggregatorUrl?: string
): Promise<EventMetadata> {
  const client = getWalrusClient();
  
  // Check if it's a full URL or just a blob ID
  let blobId: string;
  try {
    const url = new URL(blobIdOrUrl);
    // Extract blob ID from URL path: /v1/blobs/<blob-id>
    const match = url.pathname.match(/\/v1\/blobs\/(.+)$/);
    if (match) {
      blobId = match[1];
    } else {
      // If URL doesn't match expected pattern, treat as blob ID
      blobId = blobIdOrUrl;
    }
  } catch {
    // Not a valid URL, treat as blob ID
    blobId = blobIdOrUrl;
  }
  
  return client.getJSON<EventMetadata>(blobId, aggregatorUrl);
}

/**
 * Get image URL from Walrus blob ID
 * 
 * Converts a Walrus blob ID to a full URL that can be used in img src or CSS background-image.
 * If the input is already a URL, it returns it as-is.
 * 
 * @param blobIdOrUrl - Blob ID or full URL
 * @returns Full URL to the image
 */
export function getImageUrl(blobIdOrUrl: string | undefined): string | undefined {
  if (!blobIdOrUrl) {
    return undefined;
  }

  // Check if it's already a full URL
  try {
    const url = new URL(blobIdOrUrl);
    // If it's a valid URL, return it as-is
    return url.toString();
  } catch {
    // Not a valid URL, treat as blob ID and construct URL
    return getBlobUrl(blobIdOrUrl);
  }
}

/**
 * Generate ICS calendar file content
 */
export function generateICSFile(event: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
}): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tickert//Event Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@tickert.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return ics;
}

