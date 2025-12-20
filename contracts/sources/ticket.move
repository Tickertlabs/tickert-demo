module tickert::ticket;

// === Imports ===

use std::string::String;
use sui::clock::{Self, Clock};
use tickert::event::{Self, Event};

// === Constants ===

// Ticket status constants
const TICKET_STATUS_VALID: u8 = 0;
const TICKET_STATUS_USED: u8 = 1;
const TICKET_STATUS_CANCELLED: u8 = 2;

// Error codes
const EEventFull: u64 = 1;
const EEventNotActive: u64 = 2;
const ETicketAlreadyUsed: u64 = 3;
const ENotTicketOwner: u64 = 4;

// === Structs ===

/// Ticket NFT struct representing a verifiable ticket for an event
public struct Ticket has key, store {
    id: UID,
    // ID of the associated event
    event_id: ID,
    // Address of the ticket holder
    holder: address,
    // Timestamp when the ticket was minted
    mint_time: u64,
    // Ticket status (0: VALID, 1: USED, 2: CANCELLED)
    status: u8,
    // URL to encrypted ticket metadata on Walrus (decrypted via Seal)
    encrypted_metadata_url: String,
}

// === Public Functions ===

/// Mints a new ticket NFT for an event
/// Validates the event is active and has capacity, then transfers the ticket to the caller
#[allow(lint(self_transfer))]
public fun mint_ticket(
    event: &mut Event, // Event to mint ticket for
    encrypted_metadata_url: vector<u8>, // URL to encrypted ticket metadata on Walrus
    clock: &Clock, // Clock object for timestamp
    ctx: &mut TxContext, // Transaction context
) {
    // Validate event
    assert!(event::is_active(event), EEventNotActive);
    assert!(event::sold(event) < event::capacity(event), EEventFull);

    let mint_time = clock::timestamp_ms(clock);

    // Increment sold count
    event::increment_sold(event);

    let ticket = Ticket {
        id: object::new(ctx),
        event_id: object::id(event),
        holder: ctx.sender(),
        mint_time,
        status: TICKET_STATUS_VALID,
        encrypted_metadata_url: encrypted_metadata_url.to_string(),
    };

    transfer::public_transfer(ticket, ctx.sender());
}

/// Marks a ticket as used
/// Only the ticket holder can mark their ticket as used
public fun mark_as_used(
    ticket: &mut Ticket, // Ticket to mark as used
    holder: address, // Address of the ticket holder
) {
    assert!(holder == ticket.holder, ENotTicketOwner);
    assert!(ticket.status == TICKET_STATUS_VALID, ETicketAlreadyUsed);
    ticket.status = TICKET_STATUS_USED;
}

/// Cancels a ticket
/// Only the ticket holder can cancel their ticket
public fun cancel_ticket(
    ticket: &mut Ticket, // Ticket to cancel
    holder: address, // Address of the ticket holder
) {
    assert!(holder == ticket.holder, ENotTicketOwner);
    ticket.status = TICKET_STATUS_CANCELLED;
}

// === View Functions ===

/// Returns the event ID associated with this ticket
public fun event_id(ticket: &Ticket): ID {
    ticket.event_id
}

/// Returns the address of the ticket holder
public fun holder(ticket: &Ticket): address {
    ticket.holder
}

/// Returns the ticket status
public fun status(ticket: &Ticket): u8 {
    ticket.status
}

/// Checks if the ticket is valid (not used or cancelled)
public fun is_valid(ticket: &Ticket): bool {
    ticket.status == TICKET_STATUS_VALID
}

/// Returns the encrypted metadata URL
public fun encrypted_metadata_url(ticket: &Ticket): String {
    ticket.encrypted_metadata_url
}

// === Test Functions ===

#[test_only]
/// Creates a test ticket for unit testing
public fun create_test_ticket(
    event_id: ID,
    holder: address,
    encrypted_metadata_url: vector<u8>,
    mint_time: u64,
    ctx: &mut TxContext,
): Ticket {
    Ticket {
        id: object::new(ctx),
        event_id,
        holder,
        mint_time,
        status: TICKET_STATUS_VALID,
        encrypted_metadata_url: encrypted_metadata_url.to_string(),
    }
}
