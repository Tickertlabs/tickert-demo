/**
 * Header component with navigation and wallet connection
 */

import { Flex, Heading, Box } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { WalletButton } from '../wallet/WalletButton';

export function Header() {
  return (
    <Flex
      position="sticky"
      top="0"
      px="4"
      py="3"
      justify="between"
      align="center"
      style={{
        borderBottom: '1px solid var(--gray-a2)',
        backgroundColor: 'var(--gray-1)',
        zIndex: 100,
      }}
    >
      <Box>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Heading size="6">Tickert</Heading>
        </Link>
      </Box>

      <Flex gap="4" align="center">
        <Link to="/events" style={{ textDecoration: 'none' }}>
          Events
        </Link>
        <Link to="/tickets" style={{ textDecoration: 'none' }}>
          My Tickets
        </Link>
        <Link to="/organizer/events" style={{ textDecoration: 'none' }}>
          Organizer
        </Link>
        <Link to="/organizer/checkin" style={{ textDecoration: 'none' }}>
          Check-In
        </Link>
        <WalletButton />
      </Flex>
    </Flex>
  );
}

