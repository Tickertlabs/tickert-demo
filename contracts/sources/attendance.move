module tickert::attendance;

// === Imports ===

use sui::clock::{Self, Clock};
use tickert::ticket::{Self, Ticket};

// === Constants ===

// Error codes
const ETicketNotValid: u64 = 0;
const ENotTicketOwner: u64 = 2;

// === Structs ===

/// Attendance NFT struct representing proof of attendance at an event
/// Soulbound - non-transferable after minting
public struct Attendance has key, store {
    id: UID,
    // ID of the event attended
    event_id: ID,
    // Address of the attendee
    attendee: address,
    // Timestamp when attendance was verified
    timestamp: u64,
    // Whether the attendance was verified
    verified: bool,
}

// === Public Functions ===

/// Mints an attendance NFT after verifying ticket ownership and validity
/// Marks the ticket as used and transfers the attendance NFT to the attendee
public fun mint_attendance(
    ticket: &mut Ticket, // Ticket to verify
    clock: &Clock, // Clock object for timestamp
    ctx: &mut TxContext, // Transaction context
) {
    let attendee_address = ctx.sender();

    // Validate ticket ownership and status
    assert!(ticket::holder(ticket) == attendee_address, ENotTicketOwner);
    assert!(ticket::is_valid(ticket), ETicketNotValid);

    // Mark ticket as used
    ticket::mark_as_used(ticket, attendee_address);

    let event_id = ticket::event_id(ticket);
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

// === View Functions ===

/// Returns the event ID for this attendance record
public fun event_id(attendance: &Attendance): ID {
    attendance.event_id
}

/// Returns the attendee address
public fun attendee(attendance: &Attendance): address {
    attendance.attendee
}

/// Returns the timestamp when attendance was verified
public fun timestamp(attendance: &Attendance): u64 {
    attendance.timestamp
}

/// Checks if the attendance was verified
public fun is_verified(attendance: &Attendance): bool {
    attendance.verified
}

// === Test Functions ===

#[test_only]
/// Creates a test attendance NFT for unit testing
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
