/**
 * QR Code component for ticket validation
 */

import { QRCodeSVG } from 'qrcode.react';
import { Box } from '@radix-ui/themes';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 200 }: QRCodeProps) {
  return (
    <Box style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
      <QRCodeSVG value={value} size={size} />
    </Box>
  );
}

