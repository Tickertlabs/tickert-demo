#[test_only]
module tickert::attendance_tests {
    use tickert::attendance::{Self, Attendance, create_test_attendance};
    use tickert::ticket::{Self, Ticket, create_test_ticket};
    use sui::test_scenario::{Self, Scenario};
    use sui::object;

    #[test]
    fun test_mint_attendance() {
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
            // Mark ticket as used (simulating attendance verification)
            ticket::mark_as_used(&mut ticket, attendee);
            
            // Create attendance NFT
            let attendance = create_test_attendance(
                event_id,
                attendee,
                1000000000600,
                test_scenario::ctx(&mut scenario)
            );

            assert!(attendance::get_attendee(&attendance) == attendee, 0);
            assert!(attendance::get_event_id(&attendance) == event_id, 1);
            assert!(attendance::is_verified(&attendance), 2);
        };

        test_scenario::end(scenario);
    }
}

