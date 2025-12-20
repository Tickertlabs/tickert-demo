/**
 * Event creation page for organizers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Container, Heading, Card } from '@radix-ui/themes';
import { EventForm } from '../../components/event/EventForm';
import { uploadEventMetadata, generateICSFile } from '../../lib/walrus/storage';
import {
  buildCreateEventTransaction,
  getClockObjectId,
} from '../../lib/sui/transactions';
export function CreateEventPage() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    console.log('handleSubmit called with data:', data);
    
    if (!currentAccount) {
      alert('Please connect your wallet');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting event creation process...');
      // 1. Prepare metadata
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      const metadata = {
        title: data.title,
        description: data.description,
        location: {
          name: data.locationName,
          address: data.locationAddress,
        },
        category: data.category,
        agenda: [],
        speakers: [],
        announcements: [],
        ics_calendar: generateICSFile({
          title: data.title,
          description: data.description,
          startTime,
          endTime,
          location: data.locationAddress,
        }),
      };

      // 2. Upload metadata to Walrus
      console.log('Uploading metadata to Walrus...');
      const metadataUrl = await uploadEventMetadata(metadata);
      console.log('Metadata uploaded, URL:', metadataUrl);

      // 3. Build transaction
      const clockId = getClockObjectId();
      const txb = buildCreateEventTransaction(
        {
          metadataUrl,
          capacity: data.capacity,
          price: Math.floor(data.price * 1_000_000_000), // Convert SUI to MIST
          startTime: Math.floor(startTime.getTime()),
          endTime: Math.floor(endTime.getTime()),
          requiresApproval: data.requiresApproval,
          isPublic: data.isPublic,
        },
        clockId
      );

      // 4. Sign and execute
      signAndExecuteTransaction(
        {
          transaction: txb,
        },
        {
          onSuccess: (result) => {
            console.log('Event created:', result);
            navigate('/organizer/events');
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Container size="4" py="5">
      <Heading size="8" mb="5">
        Create New Event
      </Heading>
      <Card>
        <EventForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </Container>
  );
}

