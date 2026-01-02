#[test_only]
module tickert::attendance_tests;

use tickert::attendance::{Self, create_test_attendance};
use tickert::ticket::{Self, create_test_ticket};
use sui::clock;
use sui::test_scenario;

#[test]
fun test_mint_attendance() {
    let mut scenario = test_scenario::begin(@0x2);
    let attendee = @0x2;
    
    let event_id = object::id_from_address(@0x1);
    
    {
        let ticket = create_test_ticket(
            event_id,
            attendee,
            b"https://walrus.xyz/encrypted123",
            1000000000500,
            test_scenario::ctx(&mut scenario)
        );

        // Verify ticket is valid before attendance
        assert!(ticket::is_valid(&ticket));
        transfer::public_transfer(ticket, attendee);
        
        // Create attendance NFT
        let attendance = create_test_attendance(
            event_id,
            attendee,
            1000000000600,
            test_scenario::ctx(&mut scenario)
        );

        assert!(attendance::attendee(&attendance) == attendee);
        assert!(attendance::event_id(&attendance) == event_id);
        assert!(attendance::is_verified(&attendance));
        transfer::public_transfer(attendance, attendee);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_attendance_after_ticket_used() {
    let mut scenario = test_scenario::begin(@0x2);
    let attendee = @0x2;
    
    let event_id = object::id_from_address(@0x1);
    
    {
        let mut ticket = create_test_ticket(
            event_id,
            attendee,
            b"https://walrus.xyz/encrypted123",
            1000000000500,
            test_scenario::ctx(&mut scenario)
        );

        // Mark ticket as used first
        let clock = test_scenario::clock(&mut scenario);
        ticket::mark_as_used(&mut ticket, attendee, &clock);
        assert!(!ticket::is_valid(&ticket));
        transfer::public_transfer(ticket, attendee);
        
        // Create attendance NFT
        let attendance = create_test_attendance(
            event_id,
            attendee,
            1000000000600,
            test_scenario::ctx(&mut scenario)
        );

        assert!(attendance::attendee(&attendance) == attendee);
        assert!(attendance::is_verified(&attendance));
        transfer::public_transfer(attendance, attendee);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_attendance_timestamp() {
    let mut scenario = test_scenario::begin(@0x2);
    let attendee = @0x2;
    
    let event_id = object::id_from_address(@0x1);
    let timestamp = 1000000000600;
    
    {
        let attendance = create_test_attendance(
            event_id,
            attendee,
            timestamp,
            test_scenario::ctx(&mut scenario)
        );

        assert!(attendance::timestamp(&attendance) == timestamp);
        transfer::public_transfer(attendance, attendee);
    };

    test_scenario::end(scenario);
}
