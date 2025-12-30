/**
 * Seal encryption/decryption helpers
 * Handles location encryption and decryption using Seal SDK
 */

import { SealClient, SessionKey, ENCRYPTION_THRESHOLD } from './client';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { PACKAGE_ID } from '../sui/contracts';

export interface LocationData {
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
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

/**
 * Generate a unique ID for encryption
 * Format: address + nonce (5 random bytes)
 */
export function generateEncryptionId(address: string, nonce?: Uint8Array): string {
  const addressBytes = fromHex(address);
  const nonceBytes = nonce || crypto.getRandomValues(new Uint8Array(5));
  const idArray = new Uint8Array([...addressBytes, ...nonceBytes]);
  return toHex(idArray);
}

/**
 * Encrypt location data using Seal
 * 
 * @param sealClient - Seal client instance
 * @param data - Location data to encrypt
 * @param id - Unique encryption ID (address + nonce)
 * @returns Encrypted data as Uint8Array
 */
export async function encryptLocationData(
  sealClient: SealClient,
  data: LocationData,
  id: string
): Promise<Uint8Array> {
  const dataBytes = new TextEncoder().encode(JSON.stringify(data));
  
  const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
    threshold: ENCRYPTION_THRESHOLD,
    packageId: PACKAGE_ID,
    id,
    data: dataBytes,
  });

  return encryptedBytes;
}

/**
 * Decrypt location data using Seal
 * 
 * @param sealClient - Seal client instance
 * @param encryptedData - Encrypted data as Uint8Array
 * @param id - Encryption ID used for encryption
 * @param suiClient - Sui client for transaction building
 * @param sessionKey - Session key for authentication
 * @param objectId - Optional object ID for seal_approve call
 * @returns Decrypted location data
 */
export async function decryptLocationData(
  sealClient: SealClient,
  encryptedData: Uint8Array,
  id: string,
  suiClient: SuiClient,
  sessionKey: SessionKey,
  objectId?: string
): Promise<LocationData> {
  // Build transaction bytes for seal_approve
  const tx = new Transaction();
  
  if (objectId) {
    // If object ID is provided, use it in seal_approve
    // seal_approve now requires ctx parameter for whitelist checking
    const idArray = fromHex(id);
    tx.moveCall({
      target: `${PACKAGE_ID}::event::seal_approve`,
      arguments: [
        tx.pure.vector('u8', idArray),
        tx.object(objectId),
      ],
    });
  }

  const txBytes = await tx.build({ 
    client: suiClient, 
    onlyTransactionKind: true 
  });

  // Fetch keys from Seal servers
  await sealClient.fetchKeys({
    ids: [id],
    txBytes,
    sessionKey,
    threshold: ENCRYPTION_THRESHOLD,
  });

  // Decrypt the data
  const decryptedBytes = await sealClient.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  }) as Uint8Array;

  if (!decryptedBytes) {
    throw new Error('Failed to decrypt: No data returned');
  }

  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText) as LocationData;
}

/**
 * Encrypt ticket metadata using Seal
 * Similar to location encryption but for ticket-specific data
 */
export async function encryptTicketMetadata(
  sealClient: SealClient,
  metadata: TicketMetadata,
  id: string
): Promise<Uint8Array> {
  const dataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  
  const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
    threshold: ENCRYPTION_THRESHOLD,
    packageId: PACKAGE_ID,
    id,
    data: dataBytes,
  });

  return encryptedBytes;
}

/**
 * Decrypt ticket metadata using Seal
 */
export async function decryptTicketMetadata(
  sealClient: SealClient,
  encryptedData: Uint8Array,
  id: string,
  suiClient: SuiClient,
  sessionKey: SessionKey,
  objectId?: string
): Promise<TicketMetadata> {
  // Build transaction bytes for seal_approve
  const tx = new Transaction();
  
  if (objectId) {
    const idArray = fromHex(id);
    tx.moveCall({
      target: `${PACKAGE_ID}::ticket::seal_approve`,
      arguments: [
        tx.pure.vector('u8', idArray),
        tx.object(objectId),
      ],
    });
  }

  const txBytes = await tx.build({ 
    client: suiClient, 
    onlyTransactionKind: true 
  });

  // Fetch keys from Seal servers
  await sealClient.fetchKeys({
    ids: [id],
    txBytes,
    sessionKey,
    threshold: ENCRYPTION_THRESHOLD,
  });

  // Decrypt the data
  const decryptedBytes = await sealClient.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  }) as Uint8Array;

  if (!decryptedBytes) {
    throw new Error('Failed to decrypt: No data returned');
  }

  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText) as TicketMetadata;
}
