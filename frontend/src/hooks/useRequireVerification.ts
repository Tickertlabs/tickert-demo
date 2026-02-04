import { useCallback } from "react";
import { useWalletVerification } from "./useWalletVerification";

/**
 * Hook that provides a function to require verification before an action.
 * Use this in pages/components that need verified wallet access.
 */
export function useRequireVerification() {
  const { isVerified, isVerifying, verifyWallet, isConnected, walletAddress } =
    useWalletVerification();

  const requireVerification = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      throw new Error("Please connect your wallet first");
    }

    if (isVerified) {
      return true;
    }

    if (isVerifying) {
      throw new Error("Verification in progress. Please wait...");
    }

    try {
      return await verifyWallet();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to verify wallet. Please try again.");
    }
  }, [isConnected, isVerified, isVerifying, verifyWallet]);

  return {
    isVerified,
    isVerifying,
    isConnected,
    walletAddress,
    requireVerification,
    verifyWallet,
  };
}

