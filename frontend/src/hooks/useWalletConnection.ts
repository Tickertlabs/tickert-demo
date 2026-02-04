import { useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { clearAuthToken, getStoredWalletAddress } from "../lib/api/client";

/**
 * Hook that handles wallet connection state and token cleanup.
 * Clears auth token when wallet disconnects or changes.
 * Actual verification is handled by useWalletVerification when needed.
 */
export function useWalletConnection() {
  const account = useCurrentAccount();

  useEffect(() => {
    if (!account?.address) {
      // Wallet disconnected - clear stored auth
      clearAuthToken();
    } else {
      // Check if connected wallet matches stored address
      const storedAddress = getStoredWalletAddress();
      if (storedAddress && storedAddress !== account.address) {
        // Different wallet connected - clear old auth
        clearAuthToken();
      }
    }
  }, [account?.address]);

  return {
    isConnected: !!account?.address,
    walletAddress: account?.address ?? null,
  };
}
