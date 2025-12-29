/**
 * Event creation page for organizers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Container, Heading, Card } from '@radix-ui/themes';
import { EventForm } from '../../components/event/EventForm';
import { uploadEventMetadata, uploadImageToWalrus } from '../../lib/walrus/storage';
import { getSealClient } from '../../lib/seal/client';
import { encryptLocationData, generateEncryptionId } from '../../lib/seal/encryption';
import {
  buildCreateEventTransaction,
  getClockObjectId,
} from '../../lib/sui/transactions';
export function CreateEventPage() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
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
      // 1. Upload image first (if provided)
      let imageUrl: string | undefined;
      if (data.image && data.image.length > 0) {
        console.log('Uploading image to Walrus...');
        try {
          imageUrl = await uploadImageToWalrus(data.image[0]);
          console.log('Image uploaded, URL:', imageUrl);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Failed to upload image. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Handle location encryption if private
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      
      let locationEncryptionKeyId: string = '';
      let encryptedLocationUrl: string = '';
      let publicLocationName: string;
      let publicLocationAddress: string;

      if (data.locationPrivate) {
        console.log('Location is private, encrypting with Seal...');
        
        // Initialize Seal client
        const sealClient = getSealClient({ suiClient });
        
        // Generate encryption ID (address + nonce)
        const encryptionId = generateEncryptionId(currentAccount.address);
        locationEncryptionKeyId = encryptionId;
        console.log('Encryption ID created:', encryptionId);

        // Prepare location data for encryption
        const locationData = {
          location: {
            name: data.locationName,
            address: data.locationAddress,
          },
        };

        // Encrypt location data using Seal
        const encryptedLocationBytes = await encryptLocationData(
          sealClient,
          locationData,
          encryptionId
        );
        console.log('Location encrypted with Seal');

        // Upload encrypted location to Walrus
        const encryptedLocationBlob = new Blob([encryptedLocationBytes], { type: 'application/octet-stream' });
        encryptedLocationUrl = await uploadImageToWalrus(encryptedLocationBlob);
        console.log('Encrypted location uploaded to Walrus:', encryptedLocationUrl);

        // For public display, use placeholder
        publicLocationName = 'Private Location';
        publicLocationAddress = 'Location will be revealed after ticket purchase';
      } else {
        // Location is public
        publicLocationName = data.locationName;
        publicLocationAddress = data.locationAddress;
      }

      // 3. Upload large metadata (image and description only) to Walrus
      console.log('Uploading large metadata to Walrus...');
      const walrusMetadata = {
        image: imageUrl,
        description: data.description,
      };
      const metadataUrl = await uploadEventMetadata(walrusMetadata);
      console.log('Large metadata uploaded to Walrus, URL:', metadataUrl);

      // 4. Build transaction with on-chain metadata
      const clockId = getClockObjectId();
      const txb = buildCreateEventTransaction(
        {
          metadataUrl, // Walrus URL for image and description
          title: data.title,
          category: data.category,
          locationName: publicLocationName,
          locationAddress: publicLocationAddress,
          locationPrivate: data.locationPrivate || false,
          encryptedLocationUrl,
          locationEncryptionKeyId,
          capacity: data.capacity,
          price: Math.floor(data.price * 1_000_000_000), // Convert SUI to MIST
          startTime: Math.floor(startTime.getTime()),
          endTime: Math.floor(endTime.getTime()),
          requiresApproval: data.requiresApproval,
          isPublic: data.isPublic,
        },
        clockId
      );

      // 5. Sign and execute
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

