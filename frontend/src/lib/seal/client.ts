/**
 * Seal client setup using @mysten/seal SDK
 * Seal is a decentralized secrets management service for Sui
 * Used for encrypting event location data
 */

import { SealClient, SessionKey } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { PACKAGE_ID } from '../sui/contracts';

// Seal server object IDs - can be configured via environment variable or uses defaults
// Format: comma-separated list of object IDs
const DEFAULT_SEAL_SERVER_OBJECT_IDS = [
  "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
  "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"
];

const SEAL_SERVER_OBJECT_IDS = import.meta.env.VITE_SEAL_SERVER_OBJECT_IDS 
  ? import.meta.env.VITE_SEAL_SERVER_OBJECT_IDS.split(',').map((id: string) => id.trim())
  : DEFAULT_SEAL_SERVER_OBJECT_IDS;

const ENCRYPTION_THRESHOLD = 1; // Minimum number of servers needed for encryption

export interface SealClientConfig {
  suiClient: SuiClient;
  serverObjectIds?: string[];
  threshold?: number;
  verifyKeyServers?: boolean;
}

// Singleton instance
let sealClientInstance: SealClient | null = null;

/**
 * Get or create Seal client instance
 */
export function getSealClient(config: SealClientConfig): SealClient {
  if (!sealClientInstance) {
    const serverIds = config.serverObjectIds || SEAL_SERVER_OBJECT_IDS;
    
    if (serverIds.length === 0) {
      throw new Error('Seal server object IDs not configured. Please set VITE_SEAL_SERVER_OBJECT_IDS environment variable.');
    }

    sealClientInstance = new SealClient({
      suiClient: config.suiClient as any, // Seal SDK expects specific SuiClient type
      // @ts-ignore - serverConfigs is used in Seal SDK example code
      serverConfigs: serverIds.map((id: string) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: config.verifyKeyServers ?? false,
    } as any);
  }
  
  return sealClientInstance;
}

/**
 * Initialize Seal client (replaces existing instance)
 */
export function initSealClient(config: SealClientConfig): SealClient {
  sealClientInstance = null;
  return getSealClient(config);
}

/**
 * Create a session key for Seal operations
 * Session keys are used to authenticate decryption requests
 */
export async function createSessionKey(
  address: string,
  suiClient: SuiClient,
  ttlMinutes: number = 1
): Promise<SessionKey> {
  // @ts-ignore - SessionKey.create might have different API in different versions
  const sessionKey = await SessionKey.create({
    address,
    packageId: PACKAGE_ID,
    ttlMin: ttlMinutes,
    suiClient: suiClient as any,
  });

  return sessionKey;
}

/**
 * Get personal message for session key signing
 */
export async function getSessionKeyPersonalMessage(
  sessionKey: SessionKey
): Promise<Uint8Array> {
  return sessionKey.getPersonalMessage();
}

/**
 * Set personal message signature on session key
 */
export async function setSessionKeySignature(
  sessionKey: SessionKey,
  signature: string
): Promise<void> {
  await sessionKey.setPersonalMessageSignature(signature);
}

export { SealClient, SessionKey };
export { ENCRYPTION_THRESHOLD };
