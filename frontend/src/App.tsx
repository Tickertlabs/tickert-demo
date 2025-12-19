/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Container } from '@radix-ui/themes';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { EventsPage } from './pages/events/index';
import { EventDetailPage } from './pages/events/[id]';
import { OrganizerEventsPage } from './pages/organizer/events';
import { OrganizerEventDetailPage } from './pages/organizer/events/[id]';
import { CreateEventPage } from './pages/organizer/create';
import { CheckInPage } from './pages/organizer/checkin';
import { TicketsPage } from './pages/tickets/index';
import { TicketDetailPage } from './pages/tickets/[id]';

function App() {
  return (
    <BrowserRouter>
      <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/organizer/events" element={<OrganizerEventsPage />} />
            <Route path="/organizer/events/:id" element={<OrganizerEventDetailPage />} />
            <Route path="/organizer/create" element={<CreateEventPage />} />
            <Route path="/organizer/checkin" element={<CheckInPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </BrowserRouter>
  );
}

export default App;
