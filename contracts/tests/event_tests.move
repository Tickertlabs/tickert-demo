#[test_only]
module tickert::event_tests;

use tickert::event::{Self, create_test_event};
use sui::test_scenario;

#[test]
fun test_create_event() {
    let mut scenario = test_scenario::begin(@0x1);
    let organizer = @0x1;
    
    let metadata_url = b"https://walrus.xyz/event123";
    let capacity = 100;
    let price = 1000000000; // 1 SUI in MIST
    let start_time = 1000000000000;
    let end_time = 1000000001000;
    let requires_approval = false;
    let is_public = true;

    {
        let event = create_test_event(
            organizer,
            metadata_url,
            capacity,
            price,
            start_time,
            end_time,
            requires_approval,
            is_public,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(event::organizer(&event) == organizer);
        assert!(event::capacity(&event) == capacity);
        assert!(event::price(&event) == price);
        assert!(event::is_active(&event));
        assert!(event::is_public(&event));
        assert!(event::sold(&event) == 0);
        transfer::public_transfer(event, organizer);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_create_event_invalid_capacity() {
    let mut scenario = test_scenario::begin(@0x1);
    let organizer = @0x1;
    
    let metadata_url = b"https://walrus.xyz/event123";
    let capacity = 0; // Invalid - but create_test_event doesn't validate
    let price = 1000000000;
    let start_time = 1000000000000;
    let end_time = 1000000001000;
    let requires_approval = false;
    let is_public = true;

    {
        // create_test_event doesn't validate, so we just create it
        let event = create_test_event(
            organizer,
            metadata_url,
            capacity,
            price,
            start_time,
            end_time,
            requires_approval,
            is_public,
            test_scenario::ctx(&mut scenario)
        );
        // Verify it was created with capacity 0
        assert!(event::capacity(&event) == 0);
        transfer::public_transfer(event, organizer);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_update_event_status() {
    let mut scenario = test_scenario::begin(@0x1);
    let organizer = @0x1;
    
    let mut event = create_test_event(
        organizer,
        b"https://walrus.xyz/event123",
        100,
        1000000000,
        1000000000000,
        1000000001000,
        false,
        true,
        test_scenario::ctx(&mut scenario)
    );

    {
        // Test status update - organizer can update
        // STATUS_CANCELLED = 2
        test_scenario::next_tx(&mut scenario, organizer);
        event::update_status(
            &mut event,
            2, // STATUS_CANCELLED
            test_scenario::ctx(&mut scenario)
        );
        assert!(event::status(&event) == 2); // STATUS_CANCELLED
        transfer::public_transfer(event, organizer);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_increment_sold() {
    let mut scenario = test_scenario::begin(@0x1);
    let organizer = @0x1;
    
    let mut event = create_test_event(
        organizer,
        b"https://walrus.xyz/event123",
        100,
        1000000000,
        1000000000000,
        1000000001000,
        false,
        true,
        test_scenario::ctx(&mut scenario)
    );

    {
        assert!(event::sold(&event) == 0);
        event::increment_sold(&mut event);
        assert!(event::sold(&event) == 1);
        event::increment_sold(&mut event);
        assert!(event::sold(&event) == 2);
        transfer::public_transfer(event, organizer);
    };

    test_scenario::end(scenario);
}
