/**
 * Check-in page for organizers to verify attendance
 */

import { useState } from 'react';
import { useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Container, Heading, Card, Box, Text } from '@radix-ui/themes';
import { QRScanner } from '../../components/ticket/QRScanner';
import { queryTicket } from '../../lib/sui/queries';
import {
  buildMarkAttendanceTransaction,
  getClockObjectId,
} from '../../lib/sui/transactions';

export function CheckInPage() {
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [verifying, setVerifying] = useState(false);
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  const handleScan = async (ticketId: string) => {
    setVerifying(true);
    try {
      // 1. Verify ticket exists and is valid
      const ticket = await queryTicket(client, ticketId);
      if (!ticket) {
        alert('Ticket not found');
        return;
      }

      if (ticket.status !== '0') {
        alert('Ticket is not valid (already used or cancelled)');
        return;
      }

      // 2. Build mark attendance transaction
      const clockId = getClockObjectId();
      const txb = buildMarkAttendanceTransaction(ticketId, clockId);

      // 3. Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: txb,
        },
        {
          onSuccess: (result) => {
            console.log('Attendance verified:', result);
            setLastVerified(ticketId);
            alert('Attendance verified successfully!');
            setVerifying(false);
          },
          onError: (error: any) => {
            console.error('Error verifying attendance:', error);
            alert(`Failed to verify attendance: ${error.message || 'Unknown error'}`);
            setVerifying(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Error verifying attendance:', error);
      alert(`Failed to verify attendance: ${error.message || 'Unknown error'}`);
      setVerifying(false);
    }
  };

  return (
    <Container size="4" py="5">
      <Heading size="8" mb="5">
        Check-In Attendees
      </Heading>
      <Card>
        <QRScanner onScan={handleScan} />
        {lastVerified && (
          <Box mt="4" p="3" style={{ backgroundColor: 'var(--green-2)', borderRadius: 'var(--radius-2)' }}>
            <Text size="2" color="green">
              Last verified: {lastVerified.slice(0, 8)}...
            </Text>
          </Box>
        )}
        {verifying && (
          <Box mt="3">
            <Text size="2" color="gray">
              Verifying...
            </Text>
          </Box>
        )}
      </Card>
    </Container>
  );
}

