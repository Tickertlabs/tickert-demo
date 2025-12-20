#[test_only]
module tickert::ticket_tests;

use tickert::ticket::{Self, create_test_ticket};
use tickert::event::create_test_event;
use sui::test_scenario;

#[test]
fun test_mint_ticket() {
    let mut scenario = test_scenario::begin(@0x1);
    let organizer = @0x1;
    let attendee = @0x2;
    
    {
        // Create test event
        let event = create_test_event(
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
        let event_id = object::id(&event);
        transfer::public_transfer(event, organizer);

        // Create test ticket
        let ticket = create_test_ticket(
            event_id,
            attendee,
            b"https://walrus.xyz/encrypted123",
            1000000000500,
            test_scenario::ctx(&mut scenario)
        );

        assert!(ticket::holder(&ticket) == attendee);
        assert!(ticket::event_id(&ticket) == event_id);
        assert!(ticket::is_valid(&ticket));
        assert!(ticket::status(&ticket) == 0); // TICKET_STATUS_VALID = 0
        transfer::public_transfer(ticket, attendee);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_mark_ticket_as_used() {
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

        assert!(ticket::is_valid(&ticket));
        ticket::mark_as_used(&mut ticket, attendee);
        assert!(ticket::status(&ticket) == 1); // TICKET_STATUS_USED = 1
        assert!(!ticket::is_valid(&ticket));
        transfer::public_transfer(ticket, attendee);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_cancel_ticket() {
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

        assert!(ticket::is_valid(&ticket));
        ticket::cancel_ticket(&mut ticket, attendee);
        assert!(ticket::status(&ticket) == 2); // TICKET_STATUS_CANCELLED = 2
        assert!(!ticket::is_valid(&ticket));
        transfer::public_transfer(ticket, attendee);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = tickert::ticket::ENotTicketOwner)]
fun test_mark_as_used_wrong_owner() {
    let mut scenario = test_scenario::begin(@0x2);
    let attendee = @0x2;
    let wrong_owner = @0x3;
    
    let event_id = object::id_from_address(@0x1);
    
    {
        let mut ticket = create_test_ticket(
            event_id,
            attendee,
            b"https://walrus.xyz/encrypted123",
            1000000000500,
            test_scenario::ctx(&mut scenario)
        );

        ticket::mark_as_used(&mut ticket, wrong_owner);
        transfer::public_transfer(ticket, attendee);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = tickert::ticket::ETicketAlreadyUsed)]
fun test_mark_as_used_already_used() {
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

        ticket::mark_as_used(&mut ticket, attendee);
        ticket::mark_as_used(&mut ticket, attendee); // Should fail
        transfer::public_transfer(ticket, attendee);
    };

    test_scenario::end(scenario);
}
