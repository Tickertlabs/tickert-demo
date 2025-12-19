#[test_only]
module tickert::ticket_tests {
    use tickert::ticket::{Self, Ticket, create_test_ticket};
    use tickert::event::{Self, Event, create_test_event};
    use sui::test_scenario::{Self, Scenario};
    use sui::object;

    #[test]
    fun test_mint_ticket() {
        let mut scenario = test_scenario::begin(@0x1);
        let organizer = @0x1;
        let attendee = @0x2;
        
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

        // Create test ticket
        let ticket = create_test_ticket(
            event_id,
            attendee,
            b"https://walrus.xyz/encrypted123",
            1000000000500,
            test_scenario::ctx(&mut scenario)
        );

        assert!(ticket::get_holder(&ticket) == attendee, 0);
        assert!(ticket::get_event_id(&ticket) == event_id, 1);
        assert!(ticket::is_valid(&ticket), 2);

        test_scenario::end(scenario);
    }

    #[test]
    fun test_mark_ticket_as_used() {
        let mut scenario = test_scenario::begin(@0x2);
        let attendee = @0x2;
        
        let event_id = object::id_from_address(@0x1);
        let ticket = create_test_ticket(
            event_id,
            attendee,
            b"https://walrus.xyz/encrypted123",
            1000000000500,
            test_scenario::ctx(&mut scenario)
        );

        {
            ticket::mark_as_used(&mut ticket, attendee);
            assert!(ticket::get_status(&ticket) == ticket::TICKET_STATUS_USED, 0);
            assert!(!ticket::is_valid(&ticket), 1);
        };

        test_scenario::end(scenario);
    }
}

