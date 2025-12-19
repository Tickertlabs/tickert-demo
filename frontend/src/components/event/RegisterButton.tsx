/**
 * Registration button component
 */

import { Button } from '@radix-ui/themes';
import { useWallet } from '@mysten/dapp-kit';

interface RegisterButtonProps {
  eventId: string;
  price: string;
  onRegister: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function RegisterButton({
  eventId,
  price,
  onRegister,
  isLoading,
  disabled,
}: RegisterButtonProps) {
  const { isConnected } = useWallet();
  const priceInSui = Number(price) / 1_000_000_000;

  if (!isConnected) {
    return (
      <Button disabled size="3">
        Connect Wallet to Register
      </Button>
    );
  }

  return (
    <Button
      onClick={onRegister}
      disabled={disabled || isLoading}
      size="3"
    >
      {isLoading ? 'Processing...' : `Register for ${priceInSui} SUI`}
    </Button>
  );
}

