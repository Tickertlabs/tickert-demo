/**
 * Transaction building and signing helpers
 */

import { TransactionBlock } from '@mysten/sui/transactions';
import { PACKAGE_ID } from './contracts';

export interface EventParams {
  metadataUrl: string;
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
): TransactionBlock {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::event::create_event`,
    arguments: [
      txb.pure.string(params.metadataUrl),
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
): TransactionBlock {
  const txb = new TransactionBlock();

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
): TransactionBlock {
  const txb = new TransactionBlock();

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
export function getClockObjectId(network: string): string {
  // Clock object ID is the same across all networks
  return '0x6';
}

