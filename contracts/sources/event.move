module tickert::event;

use std::string::{Self, String};
use sui::clock::{Self, Clock};

//=================================================================
// Constants
//=================================================================

// Event status constants
const STATUS_DRAFT: u8 = 0;
const STATUS_ACTIVE: u8 = 1;
const STATUS_CANCELLED: u8 = 2;
const STATUS_COMPLETED: u8 = 3;

// Error codes
const E_INVALID_CAPACITY: u64 = 0;
const E_INVALID_TIME: u64 = 1;
const E_PAST_START_TIME: u64 = 2;
const E_NOT_ORGANIZER: u64 = 3;
const E_INVALID_STATUS: u64 = 4;
const E_EVENT_NOT_ACTIVE: u64 = 5;

//=================================================================
// Module Structs
//=================================================================

/// Event struct representing an event on-chain
public struct Event has key, store {
    id: UID,
    organizer: address,
    metadata_url: String,
    capacity: u64,
    price: u64,
    sold: u64,
    status: u8,
    start_time: u64,
    end_time: u64,
    created_at: u64,
    requires_approval: bool,
    is_public: bool,
}

//=================================================================
// Public Functions
//=================================================================

/// Create a new event
public entry fun create_event(
    metadata_url: vector<u8>,
    capacity: u64,
    price: u64,
    start_time: u64,
    end_time: u64,
    requires_approval: bool,
    is_public: bool,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Validation
    assert!(capacity > 0, E_INVALID_CAPACITY);
    assert!(start_time < end_time, E_INVALID_TIME);
    assert!(start_time > clock::timestamp_ms(clock), E_PAST_START_TIME);

    let metadata_url_string = string::utf8(metadata_url);
    let current_time = clock::timestamp_ms(clock);
    let sender = tx_context::sender(ctx);

    let event = Event {
        id: object::new(ctx),
        organizer: sender,
        metadata_url: metadata_url_string,
        capacity,
        price,
        sold: 0,
        status: STATUS_ACTIVE,
        start_time,
        end_time,
        created_at: current_time,
        requires_approval,
        is_public,
    };

    transfer::public_transfer(event, sender);
}

/// Update event metadata URL
public entry fun update_metadata_url(
    event: &mut Event,
    new_metadata_url: vector<u8>,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == event.organizer, E_NOT_ORGANIZER);
    event.metadata_url = string::utf8(new_metadata_url);
}

/// Update event status
public entry fun update_status(
    event: &mut Event,
    new_status: u8,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == event.organizer, E_NOT_ORGANIZER);
    assert!(
        new_status == STATUS_ACTIVE || 
            new_status == STATUS_CANCELLED || 
            new_status == STATUS_COMPLETED,
        E_INVALID_STATUS,
    );
    event.status = new_status;
}

/// Increment sold count (called when a ticket is minted)
public fun increment_sold(event: &mut Event) {
    assert!(event.sold < event.capacity, E_INVALID_CAPACITY);
    event.sold = event.sold + 1;
}

//=================================================================
// View Functions
//=================================================================

/// Get event details
public fun get_organizer(event: &Event): address {
    event.organizer
}

public fun get_capacity(event: &Event): u64 {
    event.capacity
}

public fun get_sold(event: &Event): u64 {
    event.sold
}

public fun get_price(event: &Event): u64 {
    event.price
}

public fun get_status(event: &Event): u8 {
    event.status
}

public fun is_active(event: &Event): bool {
    event.status == STATUS_ACTIVE
}

public fun requires_approval(event: &Event): bool {
    event.requires_approval
}

public fun is_public(event: &Event): bool {
    event.is_public
}

//=================================================================
// Test Functions
//=================================================================

#[test_only]
public fun create_test_event(
    organizer: address,
    metadata_url: vector<u8>,
    capacity: u64,
    price: u64,
    start_time: u64,
    end_time: u64,
    requires_approval: bool,
    is_public: bool,
    ctx: &mut TxContext,
): Event {
    Event {
        id: object::new(ctx),
        organizer,
        metadata_url: string::utf8(metadata_url),
        capacity,
        price,
        sold: 0,
        status: STATUS_ACTIVE,
        start_time,
        end_time,
        created_at: 0,
        requires_approval,
        is_public,
    }
}
