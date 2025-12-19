module tickert::ticket;

use std::string::{Self, String};
use sui::clock::{Self, Clock};
use tickert::event::{Self, Event};

//=================================================================
// Constants
//=================================================================

// Ticket status constants
const TICKET_STATUS_VALID: u8 = 0;
const TICKET_STATUS_USED: u8 = 1;
const TICKET_STATUS_CANCELLED: u8 = 2;

// Error codes
const E_INVALID_EVENT: u64 = 0;
const E_EVENT_FULL: u64 = 1;
const E_EVENT_NOT_ACTIVE: u64 = 2;
const E_TICKET_ALREADY_USED: u64 = 3;
const E_NOT_TICKET_OWNER: u64 = 4;

//=================================================================
// Module Structs
//=================================================================

/// Ticket NFT struct
public struct Ticket has key, store {
    id: UID,
    event_id: ID,
    holder: address,
    mint_time: u64,
    status: u8,
    encrypted_metadata_url: String,
}

//=================================================================
// Public Functions
//=================================================================

/// Create a new ticket NFT
public entry fun mint_ticket(
    event: &mut Event,
    encrypted_metadata_url: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Validate event
    assert!(event::is_active(event), E_EVENT_NOT_ACTIVE);
    assert!(event::get_sold(event) < event::get_capacity(event), E_EVENT_FULL);

    let holder_address = tx_context::sender(ctx);
    let mint_time = clock::timestamp_ms(clock);

    // Increment sold count
    event::increment_sold(event);

    let ticket = Ticket {
        id: object::new(ctx),
        event_id: object::id(event),
        holder: holder_address,
        mint_time,
        status: TICKET_STATUS_VALID,
        encrypted_metadata_url: string::utf8(encrypted_metadata_url),
    };

    transfer::public_transfer(ticket, holder_address);
}

/// Mark ticket as used
public entry fun mark_as_used(ticket: &mut Ticket, holder: address) {
    assert!(holder == ticket.holder, E_NOT_TICKET_OWNER);
    assert!(ticket.status == TICKET_STATUS_VALID, E_TICKET_ALREADY_USED);
    ticket.status = TICKET_STATUS_USED;
}

/// Cancel ticket
public entry fun cancel_ticket(ticket: &mut Ticket, holder: address) {
    assert!(holder == ticket.holder, E_NOT_TICKET_OWNER);
    ticket.status = TICKET_STATUS_CANCELLED;
}

//=================================================================
// View Functions
//=================================================================

/// Get ticket details
public fun get_event_id(ticket: &Ticket): ID {
    ticket.event_id
}

public fun get_holder(ticket: &Ticket): address {
    ticket.holder
}

public fun get_status(ticket: &Ticket): u8 {
    ticket.status
}

public fun is_valid(ticket: &Ticket): bool {
    ticket.status == TICKET_STATUS_VALID
}

public fun get_encrypted_metadata_url(ticket: &Ticket): String {
    ticket.encrypted_metadata_url
}

//=================================================================
// Test Functions
//=================================================================

#[test_only]
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
        encrypted_metadata_url: string::utf8(encrypted_metadata_url),
    }
}
