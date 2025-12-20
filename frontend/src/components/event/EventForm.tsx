/**
 * Event creation/editing form component
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button, TextField, TextArea, Select, Checkbox, Flex, Box, Text } from '@radix-ui/themes';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  locationName: z.string().min(1, 'Location name is required'),
  locationAddress: z.string().min(1, 'Location address is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  requiresApproval: z.boolean(),
  isPublic: z.boolean(),
  image: z.instanceof(FileList).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSubmit: (data: EventFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({ onSubmit, isLoading }: EventFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      requiresApproval: false,
      isPublic: true,
      category: '',
    },
  });

  const imageFiles = watch('image');

  // Handle image preview
  if (imageFiles && imageFiles.length > 0 && !imagePreview) {
    const file = imageFiles[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const onSubmitWithErrorHandling = async (data: EventFormData) => {
    try {
      console.log('Form submitted with data:', data);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitWithErrorHandling)}>
      <Flex direction="column" gap="4">
        <Box>
          <TextField.Root
            placeholder="Event Title"
            {...register('title')}
            size="3"
          />
          {errors.title && (
            <Text size="1" color="red" mt="1">
              {errors.title.message}
            </Text>
          )}
        </Box>

        <Box>
          <TextArea
            placeholder="Event Description"
            {...register('description')}
            rows={5}
          />
          {errors.description && (
            <Text size="1" color="red" mt="1">
              {errors.description.message}
            </Text>
          )}
        </Box>

        <Box>
          <Text size="2" weight="medium" mb="2" as="div">
            Event Image (Optional)
          </Text>
          <input
            type="file"
            accept="image/*"
            {...register('image')}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--gray-6)',
              borderRadius: '4px',
            }}
          />
          {imagePreview && (
            <Box mt="2">
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}
          {errors.image && (
            <Text size="1" color="red" mt="1">
              {errors.image.message}
            </Text>
          )}
        </Box>

        <Flex gap="4">
          <Box style={{ flex: 1 }}>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select.Root
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <Select.Trigger placeholder="Category" />
                  <Select.Content>
                    <Select.Item value="technology">Technology</Select.Item>
                    <Select.Item value="business">Business</Select.Item>
                    <Select.Item value="arts">Arts</Select.Item>
                    <Select.Item value="sports">Sports</Select.Item>
                    <Select.Item value="other">Other</Select.Item>
                  </Select.Content>
                </Select.Root>
              )}
            />
            {errors.category && (
              <Text size="1" color="red" mt="1">
                {errors.category.message}
              </Text>
            )}
          </Box>

          <Box style={{ flex: 1 }}>
            <TextField.Root
              type="number"
              placeholder="Capacity"
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && (
              <Text size="1" color="red" mt="1">
                {errors.capacity.message}
              </Text>
            )}
          </Box>

          <Box style={{ flex: 1 }}>
            <TextField.Root
              type="number"
              step="0.001"
              placeholder="Price (SUI)"
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && (
              <Text size="1" color="red" mt="1">
                {errors.price.message}
              </Text>
            )}
          </Box>
        </Flex>

        <Box>
          <TextField.Root
            placeholder="Location Name"
            {...register('locationName')}
          />
          {errors.locationName && (
            <Text size="1" color="red" mt="1">
              {errors.locationName.message}
            </Text>
          )}
        </Box>

        <Box>
          <TextField.Root
            placeholder="Location Address"
            {...register('locationAddress')}
          />
          {errors.locationAddress && (
            <Text size="1" color="red" mt="1">
              {errors.locationAddress.message}
            </Text>
          )}
        </Box>

        <Flex gap="4">
          <Box style={{ flex: 1 }}>
            <TextField.Root
              type="datetime-local"
              placeholder="Start Time"
              {...register('startTime')}
            />
            {errors.startTime && (
              <Text size="1" color="red" mt="1">
                {errors.startTime.message}
              </Text>
            )}
          </Box>

          <Box style={{ flex: 1 }}>
            <TextField.Root
              type="datetime-local"
              placeholder="End Time"
              {...register('endTime')}
            />
            {errors.endTime && (
              <Text size="1" color="red" mt="1">
                {errors.endTime.message}
              </Text>
            )}
          </Box>
        </Flex>

        <Flex gap="4">
          <Box>
            <Controller
              name="requiresApproval"
              control={control}
              render={({ field }) => (
                <label>
                  <Flex gap="2" align="center">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Text size="2">Requires Approval</Text>
                  </Flex>
                </label>
              )}
            />
          </Box>

          <Box>
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <label>
                  <Flex gap="2" align="center">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Text size="2">Public Listing</Text>
                  </Flex>
                </label>
              )}
            />
          </Box>
        </Flex>

        <Button type="submit" size="3" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Event'}
        </Button>
      </Flex>
    </form>
  );
}

