/**
 * Organizer's event detail and management page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuiClient } from '@mysten/dapp-kit';
import { 
  Container, 
  Heading, 
  Text, 
  Box, 
  Card, 
  Flex, 
  Button, 
  Grid,
  Badge,
  Separator,
  IconButton
} from '@radix-ui/themes';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  PersonIcon,
  ClockIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  CheckCircledIcon,
  CrossCircledIcon
} from '@radix-ui/react-icons';
import { queryEvent } from '../../../lib/sui/queries.js';
import { getEventMetadata, getImageUrl } from '../../../lib/walrus/storage.js';
import { Event, EventMetadata } from '../../../types/index.js';

export function OrganizerEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useSuiClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [metadata, setMetadata] = useState<EventMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;

      try {
        const eventData = await queryEvent(client, id);
        if (eventData) {
          setEvent(eventData);
          const metadataData = await getEventMetadata(eventData.metadata_url);
          setMetadata(metadataData);
        }
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id, client]);

  if (loading) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <Text>Loading event...</Text>
        </Box>
      </Container>
    );
  }

  if (!event || !metadata) {
    return (
      <Container size="4" py="9">
        <Box style={{ textAlign: 'center' }}>
          <Text>Event not found</Text>
        </Box>
      </Container>
    );
  }

  const startDate = new Date(Number(event.start_time));
  const endDate = new Date(Number(event.end_time));
  const createdDate = new Date(Number(event.created_at));
  const sold = Number(event.sold);
  const capacity = Number(event.capacity);
  const price = Number(event.price) / 1_000_000_000; // Convert MIST to SUI
  const soldPercentage = capacity > 0 ? (sold / capacity) * 100 : 0;
  const remaining = capacity - sold;

  const getStatusBadge = () => {
    switch (event.status) {
      case '1':
        return <Badge color="green">Active</Badge>;
      case '2':
        return <Badge color="red">Cancelled</Badge>;
      case '3':
        return <Badge color="gray">Completed</Badge>;
      default:
        return <Badge color="orange">Draft</Badge>;
    }
  };

  const imageUrl = metadata.image ? getImageUrl(metadata.image) : undefined;

  return (
    <Container size="4" py="5">
      <Flex direction="column" gap="5">
        {/* Header with back button */}
        <Flex align="center" gap="3">
          <IconButton 
            variant="ghost" 
            onClick={() => navigate('/organizer/events')}
            style={{ cursor: 'pointer' }}
          >
            <ArrowLeftIcon width="20" height="20" />
          </IconButton>
          <Heading size="8">Event Details</Heading>
        </Flex>

        {/* Event Image */}
        {imageUrl && (
          <Box
            style={{
              width: '100%',
              height: '400px',
              borderRadius: 'var(--radius-3)',
              overflow: 'hidden',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <Grid columns={{ initial: '1', md: '3' }} gap="5">
          {/* Main Content */}
          <Box style={{ gridColumn: 'span 2' }}>
            <Card>
              <Flex direction="column" gap="4">
                {/* Title and Status */}
                <Flex justify="between" align="start">
                  <Box>
                    <Heading size="8" mb="2">
                      {metadata.title || event.title}
                    </Heading>
                    <Flex gap="2" align="center" mb="3">
                      {getStatusBadge()}
                      <Badge variant="soft">{event.category}</Badge>
                      {event.is_public ? (
                        <Badge variant="soft" color="blue">
                          <EyeOpenIcon width="12" height="12" style={{ marginRight: '4px', display: 'inline' }} />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="soft" color="gray">
                          <EyeClosedIcon width="12" height="12" style={{ marginRight: '4px', display: 'inline' }} />
                          Private
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                </Flex>

                <Separator />

                {/* Description */}
                {metadata.description && (
                  <Box>
                    <Heading size="4" mb="2">Description</Heading>
                    <Text size="3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {metadata.description}
                    </Text>
                  </Box>
                )}

                <Separator />

                {/* Event Information */}
                <Box>
                  <Heading size="4" mb="3">Event Information</Heading>
                  <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                    <Flex gap="2" align="center">
                      <CalendarIcon width="18" height="18" style={{ color: 'var(--gray-9)' }} />
                      <Box>
                        <Text size="1" color="gray">Start Time</Text>
                        <Text size="3" weight="medium">
                          {startDate.toLocaleString()}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex gap="2" align="center">
                      <ClockIcon width="18" height="18" style={{ color: 'var(--gray-9)' }} />
                      <Box>
                        <Text size="1" color="gray">End Time</Text>
                        <Text size="3" weight="medium">
                          {endDate.toLocaleString()}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex gap="2" align="center">
                      <PersonIcon width="18" height="18" style={{ color: 'var(--gray-9)' }} />
                      <Box>
                        <Text size="1" color="gray">Location</Text>
                        <Text size="3" weight="medium">
                          {event.location_private ? (
                            <Flex gap="1" align="center">
                              <Text>Private Location</Text>
                              <Badge size="1" variant="soft">Encrypted</Badge>
                            </Flex>
                          ) : (
                            <>
                              {event.location_name || 'TBA'}
                              {event.location_address && (
                                <Text size="2" color="gray" style={{ display: 'block' }}>
                                  {event.location_address}
                                </Text>
                              )}
                            </>
                          )}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex gap="2" align="center">
                      <Text size="3" weight="bold" style={{ color: 'var(--gray-9)' }}>$</Text>
                      <Box>
                        <Text size="1" color="gray">Price</Text>
                        <Text size="3" weight="medium">
                          {price > 0 ? `${price} SUI` : 'Free'}
                        </Text>
                      </Box>
                    </Flex>
                  </Grid>
                </Box>

                <Separator />

                {/* Additional Settings */}
                <Box>
                  <Heading size="4" mb="3">Settings</Heading>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Text size="3">Requires Approval</Text>
                      {event.requires_approval ? (
                        <Badge color="green">
                          <CheckCircledIcon width="12" height="12" style={{ marginRight: '4px', display: 'inline' }} />
                          Yes
                        </Badge>
                      ) : (
                        <Badge color="gray">
                          <CrossCircledIcon width="12" height="12" style={{ marginRight: '4px', display: 'inline' }} />
                          No
                        </Badge>
                      )}
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="3">Created At</Text>
                      <Text size="2" color="gray">
                        {createdDate.toLocaleString()}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              </Flex>
            </Card>
          </Box>

          {/* Sidebar */}
          <Box>
            <Flex direction="column" gap="4">
              {/* Ticket Sales Stats */}
              <Card>
                <Heading size="4" mb="4">Ticket Sales</Heading>
                <Flex direction="column" gap="4">
                  <Box>
                    <Flex justify="between" align="center" mb="2">
                      <Text size="3" weight="medium">Sold</Text>
                      <Text size="4" weight="bold">
                        {sold} / {capacity}
                      </Text>
                    </Flex>
                    <Box
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--gray-3)',
                        borderRadius: 'var(--radius-2)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        style={{
                          width: `${soldPercentage}%`,
                          height: '100%',
                          backgroundColor: 'var(--accent-9)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                    <Text size="2" color="gray" mt="1">
                      {soldPercentage.toFixed(1)}% sold
                    </Text>
                  </Box>

                  <Separator />

                  <Box>
                    <Text size="2" color="gray">Remaining</Text>
                    <Text size="5" weight="bold" color="green">
                      {remaining}
                    </Text>
                  </Box>

                  <Box>
                    <Text size="2" color="gray">Total Revenue</Text>
                    <Text size="5" weight="bold">
                      {(sold * price).toFixed(2)} SUI
                    </Text>
                  </Box>
                </Flex>
              </Card>

              {/* Actions */}
              <Card>
                <Heading size="4" mb="4">Actions</Heading>
                <Flex direction="column" gap="2">
                  <Button variant="soft" size="3" style={{ width: '100%' }}>
                    Edit Event
                  </Button>
                  <Button variant="soft" size="3" style={{ width: '100%' }}>
                    View Analytics
                  </Button>
                  <Button 
                    variant="soft" 
                    color="red" 
                    size="3" 
                    style={{ width: '100%' }}
                    disabled={event.status === '2' || event.status === '3'}
                  >
                    {event.status === '2' ? 'Cancelled' : 'Cancel Event'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="3" 
                    style={{ width: '100%' }}
                    onClick={() => navigate(`/events/${id}`)}
                  >
                    View Public Page
                  </Button>
                </Flex>
              </Card>
            </Flex>
          </Box>
        </Grid>
      </Flex>
    </Container>
  );
}

