/**
 * Walrus storage operations
 * Handles event metadata upload and retrieval
 */

import { getWalrusClient } from './client';

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
 */
export async function uploadEventMetadata(
  metadata: EventMetadata
): Promise<string> {
  const client = getWalrusClient();
  const jsonString = JSON.stringify(metadata, null, 2);
  const url = await client.uploadBlob(jsonString);
  return url;
}

/**
 * Upload image to Walrus
 */
export async function uploadImageToWalrus(
  imageFile: File | Blob
): Promise<string> {
  const client = getWalrusClient();
  const url = await client.uploadBlob(imageFile);
  return url;
}

/**
 * Retrieve event metadata from Walrus
 */
export async function getEventMetadata(
  metadataUrl: string
): Promise<EventMetadata> {
  const client = getWalrusClient();
  return client.getJSON<EventMetadata>(metadataUrl);
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

