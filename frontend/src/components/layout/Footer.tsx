/**
 * Footer component
 */

import { Box, Text } from '@radix-ui/themes';

export function Footer() {
  return (
    <Box
      mt="9"
      py="4"
      px="4"
      style={{
        borderTop: '1px solid var(--gray-a2)',
        textAlign: 'center',
      }}
    >
      <Text size="2" color="gray">
        Tickert - Decentralized Event Ticketing Platform
      </Text>
    </Box>
  );
}

