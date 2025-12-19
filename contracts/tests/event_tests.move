#[test_only]
module tickert::event_tests {
    use tickert::event::{Self, Event, create_test_event};
    use sui::test_scenario::{Self, Scenario};
    use sui::object;
    use std::string;

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
            
            assert!(event::get_organizer(&event) == organizer, 0);
            assert!(event::get_capacity(&event) == capacity, 1);
            assert!(event::get_price(&event) == price, 2);
            assert!(event::is_active(&event), 3);
            assert!(event::is_public(&event), 4);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = tickert::event::E_INVALID_CAPACITY)]
    fun test_create_event_invalid_capacity() {
        let mut scenario = test_scenario::begin(@0x1);
        let organizer = @0x1;
        
        let metadata_url = b"https://walrus.xyz/event123";
        let capacity = 0; // Invalid
        let price = 1000000000;
        let start_time = 1000000000000;
        let end_time = 1000000001000;
        let requires_approval = false;
        let is_public = true;

        {
            create_test_event(
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
        };

        test_scenario::end(scenario);
    }
}

