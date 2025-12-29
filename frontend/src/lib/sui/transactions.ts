/**
 * Transaction building and signing helpers
 */

import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from './contracts';

export interface EventParams {
  metadataUrl: string; // Walrus URL for image and description
  title: string;
  category: string;
  locationName: string;
  locationAddress: string;
  locationPrivate: boolean;
  encryptedLocationUrl: string; // Empty if locationPrivate is false
  locationEncryptionKeyId: string; // Empty if locationPrivate is false
  capacity: number;
  price: number;
  startTime: number;
  endTime: number;
  requiresApproval: boolean;
  isPublic: boolean;
}

export interface TicketParams {
  eventId: string;
  encryptedMetadataUrl: string;
}

/**
 * Build transaction for creating an event
 */
export function buildCreateEventTransaction(
  params: EventParams,
  clockId: string
): Transaction {
  const txb = new Transaction();

  txb.moveCall({
    target: `${PACKAGE_ID}::event::create_event`,
    arguments: [
      txb.pure.string(params.metadataUrl), // Walrus URL for image and description
      txb.pure.string(params.title),
      txb.pure.string(params.category),
      txb.pure.string(params.locationName),
      txb.pure.string(params.locationAddress),
      txb.pure.bool(params.locationPrivate),
      txb.pure.string(params.encryptedLocationUrl),
      txb.pure.string(params.locationEncryptionKeyId),
      txb.pure.u64(params.capacity),
      txb.pure.u64(params.price),
      txb.pure.u64(params.startTime),
      txb.pure.u64(params.endTime),
      txb.pure.bool(params.requiresApproval),
      txb.pure.bool(params.isPublic),
      txb.object(clockId),
    ],
  });

  return txb;
}

/**
 * Build transaction for minting a ticket
 */
export function buildMintTicketTransaction(
  params: TicketParams,
  eventId: string,
  clockId: string
): Transaction {
  const txb = new Transaction();

  txb.moveCall({
    target: `${PACKAGE_ID}::ticket::mint_ticket`,
    arguments: [
      txb.object(eventId),
      txb.pure.string(params.encryptedMetadataUrl),
      txb.object(clockId),
    ],
  });

  return txb;
}

/**
 * Build transaction for marking attendance
 */
export function buildMarkAttendanceTransaction(
  ticketId: string,
  clockId: string
): Transaction {
  const txb = new Transaction();

  txb.moveCall({
    target: `${PACKAGE_ID}::attendance::mint_attendance`,
    arguments: [
      txb.object(ticketId),
      txb.object(clockId),
    ],
  });

  return txb;
}

/**
 * Get clock object ID (shared clock on Sui)
 */
export function getClockObjectId(): string {
  // Clock object ID is the same across all networks
  return '0x6';
}

