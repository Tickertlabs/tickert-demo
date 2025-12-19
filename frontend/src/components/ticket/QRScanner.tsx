/**
 * QR Code scanner component for attendance verification
 * Note: This is a basic implementation. In production, use a proper QR scanner library
 */

import { useState } from 'react';
import { Box, Button, Text } from '@radix-ui/themes';

interface QRScannerProps {
  onScan: (ticketId: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [manualInput, setManualInput] = useState('');

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  // TODO: Implement actual QR code scanning using a library like html5-qrcode
  // For MVP, we'll use manual input
  return (
    <Box>
      <Text size="3" weight="bold" mb="3">
        Scan Ticket QR Code
      </Text>
      <Box mb="3">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Enter ticket ID or scan QR code"
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: 'var(--radius-2)',
            border: '1px solid var(--gray-a6)',
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleManualSubmit();
            }
          }}
        />
      </Box>
      <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
        Verify Ticket
      </Button>
      <Text size="1" color="gray" mt="2" style={{ display: 'block' }}>
        Note: Full QR scanner integration coming soon
      </Text>
    </Box>
  );
}

