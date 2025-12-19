module tickert::attendance;

use sui::clock::{Self, Clock};
use tickert::ticket::{Self, Ticket};

//=================================================================
// Constants
//=================================================================

// Error codes
const E_TICKET_NOT_VALID: u64 = 0;
const E_ALREADY_ATTENDED: u64 = 1;
const E_NOT_TICKET_OWNER: u64 = 2;

//=================================================================
// Module Structs
//=================================================================

/// Attendance NFT struct (soulbound - non-transferable)
public struct Attendance has key, store {
    id: UID,
    event_id: ID,
    attendee: address,
    timestamp: u64,
    verified: bool,
}

//=================================================================
// Public Functions
//=================================================================

/// Create attendance NFT after verifying ticket
public entry fun mint_attendance(
    ticket: &mut Ticket,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let attendee_address = tx_context::sender(ctx);

    // Validate ticket ownership and status
    assert!(ticket::get_holder(ticket) == attendee_address, E_NOT_TICKET_OWNER);
    assert!(ticket::is_valid(ticket), E_TICKET_NOT_VALID);

    // Mark ticket as used
    ticket::mark_as_used(ticket, attendee_address);

    let event_id = ticket::get_event_id(ticket);
    let timestamp = clock::timestamp_ms(clock);

    let attendance = Attendance {
        id: object::new(ctx),
        event_id,
        attendee: attendee_address,
        timestamp,
        verified: true,
    };

    // Transfer to attendee (soulbound - cannot be transferred)
    transfer::public_transfer(attendance, attendee_address);
}

//=================================================================
// View Functions
//=================================================================

/// Get attendance details
public fun get_event_id(attendance: &Attendance): ID {
    attendance.event_id
}

public fun get_attendee(attendance: &Attendance): address {
    attendance.attendee
}

public fun get_timestamp(attendance: &Attendance): u64 {
    attendance.timestamp
}

public fun is_verified(attendance: &Attendance): bool {
    attendance.verified
}

//=================================================================
// Test Functions
//=================================================================

#[test_only]
public fun create_test_attendance(
    event_id: ID,
    attendee: address,
    timestamp: u64,
    ctx: &mut TxContext,
): Attendance {
    Attendance {
        id: object::new(ctx),
        event_id,
        attendee,
        timestamp,
        verified: true,
    }
}
