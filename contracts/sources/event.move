module tickert::event;

// === Imports ===

use std::string::String;
use sui::clock::{Self, Clock};

// === Constants ===

// Event status constants
const STATUS_ACTIVE: u8 = 1;
const STATUS_CANCELLED: u8 = 2;
const STATUS_COMPLETED: u8 = 3;

// Error codes
const EInvalidCapacity: u64 = 0;
const EInvalidTime: u64 = 1;
const EPastStartTime: u64 = 2;
const ENotOrganizer: u64 = 3;
const EInvalidStatus: u64 = 4;

// === Structs ===

/// Event struct representing an event on-chain
public struct Event has key, store {
    id: UID,
    // Address of the event organizer
    organizer: address,
    // URL to large metadata stored on Walrus (image and description only)
    metadata_url: String,
    // Event title
    title: String,
    // Event category
    category: String,
    // Location name (public or placeholder if private)
    location_name: String,
    // Location address (public or placeholder if private)
    location_address: String,
    // Whether location is private (encrypted)
    location_private: bool,
    // URL to encrypted location data on Walrus (empty if location_private is false)
    encrypted_location_url: String,
    // Seal key ID for location decryption (empty if location_private is false)
    location_encryption_key_id: String,
    // Maximum number of tickets available
    capacity: u64,
    // Ticket price in MIST (1 SUI = 1,000,000,000 MIST)
    price: u64,
    // Number of tickets sold
    sold: u64,
    // Event status (0: DRAFT, 1: ACTIVE, 2: CANCELLED, 3: COMPLETED)
    status: u8,
    // Event start time in milliseconds (Unix timestamp)
    start_time: u64,
    // Event end time in milliseconds (Unix timestamp)
    end_time: u64,
    // Event creation timestamp in milliseconds
    created_at: u64,
    // Whether the event requires approval for registration
    requires_approval: bool,
    // Whether the event is publicly listed
    is_public: bool,
}

// === Public Functions ===

/// Creates a new event and transfers it to the organizer
#[allow(lint(self_transfer))]
public fun create_event(
    metadata_url: vector<u8>, // URL to large metadata on Walrus (image and description only)
    title: vector<u8>, // Event title
    category: vector<u8>, // Event category
    location_name: vector<u8>, // Location name (public or placeholder if private)
    location_address: vector<u8>, // Location address (public or placeholder if private)
    location_private: bool, // Whether location is private (encrypted)
    encrypted_location_url: vector<u8>, // URL to encrypted location on Walrus (empty if not private)
    location_encryption_key_id: vector<u8>, // Seal key ID for decryption (empty if not private)
    capacity: u64, // Maximum number of tickets
    price: u64, // Ticket price in MIST
    start_time: u64, // Event start time in milliseconds
    end_time: u64, // Event end time in milliseconds
    requires_approval: bool, // Whether registration requires approval
    is_public: bool, // Whether event is publicly listed
    clock: &Clock, // Clock object for timestamp
    ctx: &mut TxContext, // Transaction context
) {
    // Validation
    assert!(capacity > 0, EInvalidCapacity);
    assert!(start_time < end_time, EInvalidTime);
    assert!(start_time > clock::timestamp_ms(clock), EPastStartTime);

    let metadata_url_string = metadata_url.to_string();
    let title_string = title.to_string();
    let category_string = category.to_string();
    let location_name_string = location_name.to_string();
    let location_address_string = location_address.to_string();
    let encrypted_location_url_string = encrypted_location_url.to_string();
    let location_encryption_key_id_string = location_encryption_key_id.to_string();
    let current_time = clock::timestamp_ms(clock);

    let event = Event {
        id: object::new(ctx),
        organizer: ctx.sender(),
        metadata_url: metadata_url_string,
        title: title_string,
        category: category_string,
        location_name: location_name_string,
        location_address: location_address_string,
        location_private,
        encrypted_location_url: encrypted_location_url_string,
        location_encryption_key_id: location_encryption_key_id_string,
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

    transfer::public_transfer(event, ctx.sender());
}

/// Updates the event metadata URL
/// Only the organizer can update the metadata URL
public fun update_metadata_url(
    event: &mut Event, // Event to update
    new_metadata_url: vector<u8>, // New metadata URL
    ctx: &mut TxContext, // Transaction context
) {
    assert!(ctx.sender() == event.organizer, ENotOrganizer);
    event.metadata_url = new_metadata_url.to_string();
}

/// Updates the event status
/// Only the organizer can update the status
public fun update_status(
    event: &mut Event, // Event to update
    new_status: u8, // New status (must be ACTIVE, CANCELLED, or COMPLETED)
    ctx: &mut TxContext, // Transaction context
) {
    assert!(ctx.sender() == event.organizer, ENotOrganizer);
    assert!(
        new_status == STATUS_ACTIVE || 
            new_status == STATUS_CANCELLED || 
            new_status == STATUS_COMPLETED,
        EInvalidStatus,
    );
    event.status = new_status;
}

/// Increments the sold ticket count
/// Called internally when a ticket is minted
public fun increment_sold(event: &mut Event) {
    assert!(event.sold < event.capacity, EInvalidCapacity);
    event.sold = event.sold + 1;
}

// === View Functions ===

/// Returns the organizer address
public fun organizer(event: &Event): address {
    event.organizer
}

/// Returns the event capacity
public fun capacity(event: &Event): u64 {
    event.capacity
}

/// Returns the number of tickets sold
public fun sold(event: &Event): u64 {
    event.sold
}

/// Returns the ticket price in MIST
public fun price(event: &Event): u64 {
    event.price
}

/// Returns the event status
public fun status(event: &Event): u8 {
    event.status
}

/// Checks if the event is active
public fun is_active(event: &Event): bool {
    event.status == STATUS_ACTIVE
}

/// Checks if the event requires approval for registration
public fun requires_approval(event: &Event): bool {
    event.requires_approval
}

/// Checks if the event is publicly listed
public fun is_public(event: &Event): bool {
    event.is_public
}

/// Returns the event title
public fun title(event: &Event): String {
    event.title
}

/// Returns the event category
public fun category(event: &Event): String {
    event.category
}

/// Returns the location name
public fun location_name(event: &Event): String {
    event.location_name
}

/// Returns the location address
public fun location_address(event: &Event): String {
    event.location_address
}

/// Checks if location is private
public fun location_private(event: &Event): bool {
    event.location_private
}

/// Returns encrypted location URL (empty if not private)
public fun encrypted_location_url(event: &Event): String {
    event.encrypted_location_url
}

/// Returns location encryption key ID (empty if not private)
public fun location_encryption_key_id(event: &Event): String {
    event.location_encryption_key_id
}

// === Test Functions ===

#[test_only]
/// Creates a test event for unit testing
public fun create_test_event(
    organizer: address,
    metadata_url: vector<u8>,
    title: vector<u8>,
    category: vector<u8>,
    location_name: vector<u8>,
    location_address: vector<u8>,
    location_private: bool,
    encrypted_location_url: vector<u8>,
    location_encryption_key_id: vector<u8>,
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
        metadata_url: metadata_url.to_string(),
        title: title.to_string(),
        category: category.to_string(),
        location_name: location_name.to_string(),
        location_address: location_address.to_string(),
        location_private,
        encrypted_location_url: encrypted_location_url.to_string(),
        location_encryption_key_id: location_encryption_key_id.to_string(),
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
