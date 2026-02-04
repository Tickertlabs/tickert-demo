/**
 * Custom wallet button wrapper
 * Extends the dapp-kit ConnectButton with verification status
 */

import { ConnectButton } from "@mysten/dapp-kit";
import { Flex, Text, Box, Button } from "@radix-ui/themes";
import { useWalletVerification } from "../../hooks/useWalletVerification";

export function WalletButton() {
  const { isConnected, isVerified, isVerifying, verifyWallet } =
    useWalletVerification(true); // Auto-verify on connect

  const handleVerifyClick = () => {
    verifyWallet().catch(() => {
      // User rejected - do nothing
    });
  };

  return (
    <Flex align="center" gap="2">
      {isConnected && (
        <VerificationBadge
          isVerified={isVerified}
          isVerifying={isVerifying}
          onVerifyClick={handleVerifyClick}
        />
      )}
      <ConnectButton />
    </Flex>
  );
}

interface VerificationBadgeProps {
  isVerified: boolean;
  isVerifying: boolean;
  onVerifyClick: () => void;
}

function VerificationBadge({
  isVerified,
  isVerifying,
  onVerifyClick,
}: VerificationBadgeProps) {
  if (isVerifying) {
    return (
      <Box
        px="2"
        py="1"
        style={{
          backgroundColor: "var(--amber-3)",
          borderRadius: "var(--radius-2)",
          border: "1px solid var(--amber-6)",
        }}
      >
        <Text size="1" weight="medium" style={{ color: "var(--amber-11)" }}>
          Verifying...
        </Text>
      </Box>
    );
  }

  if (isVerified) {
    return (
      <Box
        px="2"
        py="1"
        style={{
          backgroundColor: "var(--green-3)",
          borderRadius: "var(--radius-2)",
          border: "1px solid var(--green-6)",
        }}
      >
        <Text size="1" weight="medium" style={{ color: "var(--green-11)" }}>
          ✓ Verified
        </Text>
      </Box>
    );
  }

  return (
    <Button
      size="1"
      variant="soft"
      color="orange"
      onClick={onVerifyClick}
      style={{ cursor: "pointer" }}
    >
      <Text size="1" weight="medium">
        ⚠ Sign to verify
      </Text>
    </Button>
  );
}

