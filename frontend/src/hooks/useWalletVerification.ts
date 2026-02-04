import { useState, useCallback, useEffect, useRef } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import {
  connectWallet,
  getAuthToken,
  getStoredWalletAddress,
  clearAuthToken,
} from "../lib/api/client";

const CONNECT_MESSAGE = "Test";

export interface UseWalletVerificationReturn {
  isVerified: boolean;
  isVerifying: boolean;
  verifyWallet: () => Promise<boolean>;
  isConnected: boolean;
  walletAddress: string | null;
}

export function useWalletVerification(
  autoVerify: boolean = false,
): UseWalletVerificationReturn {
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Track which address we've already attempted verification for
  const attemptedRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!account?.address) {
      throw new Error("Wallet not connected");
    }

    if (isProcessingRef.current) {
      throw new Error("Verification already in progress");
    }

    isProcessingRef.current = true;
    setIsVerifying(true);

    try {
      const message = new TextEncoder().encode(CONNECT_MESSAGE);
      const result = await signPersonalMessage({ message });

      await connectWallet(account.address, result.signature, result.bytes);

      attemptedRef.current = account.address;
      setIsVerified(true);
      return true;
    } catch (error) {
      attemptedRef.current = account.address; // Mark as attempted even on failure
      setIsVerified(false);
      throw error;
    } finally {
      isProcessingRef.current = false;
      setIsVerifying(false);
    }
  }, [account?.address, signPersonalMessage]);

  // Handle wallet connection changes and auto-verification
  useEffect(() => {
    const address = account?.address;

    if (!address) {
      // Wallet disconnected - reset everything
      clearAuthToken();
      attemptedRef.current = null;
      setIsVerified(false);
      return;
    }

    // Check if we have a valid token for this address
    const storedAddress = getStoredWalletAddress();
    const token = getAuthToken();

    if (token && storedAddress === address) {
      // Already verified with valid token
      attemptedRef.current = address;
      setIsVerified(true);
      return;
    }

    // Different wallet connected - clear old token
    if (storedAddress && storedAddress !== address) {
      clearAuthToken();
    }

    // Reset verification state for new address
    setIsVerified(false);

    // Auto-verify if enabled and not already attempted for this address
    if (
      autoVerify &&
      attemptedRef.current !== address &&
      !isProcessingRef.current
    ) {
      isProcessingRef.current = true;
      setIsVerifying(true);

      const message = new TextEncoder().encode(CONNECT_MESSAGE);

      signPersonalMessage({ message })
        .then((result) => {
          return connectWallet(address, result.signature, result.bytes);
        })
        .then(() => {
          attemptedRef.current = address;
          setIsVerified(true);
        })
        .catch(() => {
          attemptedRef.current = address; // Mark as attempted
        })
        .finally(() => {
          isProcessingRef.current = false;
          setIsVerifying(false);
        });
    }
  }, [account?.address, autoVerify, signPersonalMessage]);

  return {
    isVerified,
    isVerifying,
    verifyWallet,
    isConnected: !!account?.address,
    walletAddress: account?.address ?? null,
  };
}
