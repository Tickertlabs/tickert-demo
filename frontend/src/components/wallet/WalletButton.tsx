/**
 * Custom wallet button wrapper
 * Extends the dapp-kit ConnectButton with additional functionality
 */

import { ConnectButton } from '@mysten/dapp-kit';
import { Box } from '@radix-ui/themes';

export function WalletButton() {
  return (
    <Box>
      <ConnectButton />
    </Box>
  );
}

