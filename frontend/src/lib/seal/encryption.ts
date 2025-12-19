/**
 * Seal encryption/decryption helpers
 * Handles ticket metadata encryption and decryption
 */

import { getSealClient } from './client';

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

/**
 * Encrypt ticket metadata
 * This encrypts sensitive information like private location or access links
 */
export async function encryptTicketMetadata(
  metadata: TicketMetadata,
  keyId: string
): Promise<string> {
  const client = getSealClient();
  const jsonString = JSON.stringify(metadata);
  const encrypted = await client.encrypt(keyId, jsonString);
  return encrypted;
}

/**
 * Decrypt ticket metadata
 * Only the ticket holder should be able to decrypt this
 */
export async function decryptTicketMetadata(
  encrypted: string,
  keyId: string
): Promise<TicketMetadata> {
  const client = getSealClient();
  const decrypted = await client.decrypt(keyId, encrypted);
  return JSON.parse(decrypted) as TicketMetadata;
}

/**
 * Generate encryption key for a ticket
 * In production, this would be tied to the ticket holder's wallet
 */
export async function generateTicketKey(): Promise<string> {
  const client = getSealClient();
  return client.createKey();
}

