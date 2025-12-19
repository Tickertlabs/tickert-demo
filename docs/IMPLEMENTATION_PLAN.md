# Tickert Platform Implementation Plan

## Mimari Genel Bakış

Platform üç ana bileşenden oluşur:

1. **Sui Move Smart Contracts**: NFT ticketing, attendance tracking, event management
2. **Backend API**: Walrus/Seal entegrasyonları, event metadata yönetimi
3. **Frontend Web App**: Organizer ve attendee arayüzleri

### Teknoloji Stack

- **Frontend**: Vite + React + TypeScript (via `@mysten/create-dapp`)
- **UI Framework**: Radix UI (template'de dahil) + Tailwind CSS
- **Blockchain**: Sui Move + @mysten/dapp-kit (template'de dahil)
- **Storage**: Walrus (event metadata, encrypted ticket data)
- **Encryption**: Seal (ticket metadata encryption)
- **Authentication**: ZkLogin (Sui native)
- **State Management**: React Context / Zustand
- **Build Tool**: Vite
- **Linting**: ESLint (template'de dahil)

## Aşama 1: MVP (Minimum Viable Product)

### 1.1 Proje Yapısı ve Temel Kurulum

**Dosya Yapısı:**

```
tickert/
├── contracts/              # Sui Move smart contracts
│   ├── Move.toml
│   ├── sources/
│   │   ├── event.move
│   │   ├── ticket.move
│   │   └── attendance.move
│   └── tests/
├── src/                    # Vite + React application (from @mysten/create-dapp)
│   ├── components/
│   │   ├── layout/
│   │   ├── event/
│   │   ├── ticket/
│   │   └── wallet/
│   ├── lib/
│   │   ├── sui/           # Sui client, contract interactions
│   │   ├── walrus/        # Walrus storage integration
│   │   └── seal/          # Seal encryption integration
│   ├── pages/             # React Router pages (veya routing library)
│   │   ├── events/
│   │   ├── tickets/
│   │   └── organizer/
│   ├── types/
│   └── App.tsx
├── services/               # Backend services (API proxy veya ayrı server)
│   ├── walrus.ts
│   ├── seal.ts
│   └── api/               # API endpoints (Vite proxy veya Express/Fastify)
└── docs/
```

**Kurulum Adımları:**

1. `npm create @mysten/dapp` komutu ile proje oluştur
   - Template seçimi: `react-e2e-counter` (Move contract örneği içerdiği için)
2. Sui CLI kurulumu: `cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui`
3. Move contracts klasörü oluştur ve yapılandır
4. Ek bağımlılıklar: Walrus SDK, Seal SDK, QR code library, ICS calendar generator

### 1.2 Sui Move Smart Contracts

**`contracts/sources/event.move`**

- Event struct tanımları (id, organizer, metadata_url, capacity, price, etc.)
- Event creation fonksiyonları
- Event metadata güncelleme
- Event durumu yönetimi (active, cancelled, completed)

**`contracts/sources/ticket.move`**

- Ticket NFT struct (event_id, holder, mint_time, status)
- Ticket minting fonksiyonları
- Ticket transfer/ownership yönetimi
- Ticket validation fonksiyonları

**`contracts/sources/attendance.move`**

- Attendance NFT struct (event_id, attendee, timestamp, verified)
- Attendance minting (soulbound optional)
- Attendance verification logic

**Test Coverage:**

- Unit testler her contract için
- Integration testler contract'lar arası etkileşimler için

### 1.3 Frontend - Temel UI Bileşenleri

**Layout & Navigation:**

- `src/components/layout/Header.tsx` - Navigation, wallet connection (dapp-kit WalletButton kullan)
- `src/components/layout/Footer.tsx`
- Responsive design (mobile-first, Tailwind CSS)

**Wallet Integration:**

- `@mysten/dapp-kit` zaten template'de dahil (WalletProvider, useWallet hook)
- `src/components/wallet/WalletButton.tsx` - Custom wallet button wrapper (isteğe bağlı)
- ZkLogin integration hazırlığı (MVP'de opsiyonel)

**Event Management (Organizer):**

- `src/pages/organizer/create.tsx` - Event creation form
- `src/pages/organizer/events.tsx` - Organizer'ın event listesi
- `src/pages/organizer/events/[id].tsx` - Event detay ve yönetim
- `src/components/event/EventForm.tsx` - Event creation/editing form
- `src/components/event/EventCard.tsx` - Event preview card

**Event Discovery & Registration (Attendee):**

- `src/pages/events/index.tsx` - Public event listing
- `src/pages/events/[id].tsx` - Event detay ve registration
- `src/components/event/EventList.tsx` - Event grid/list view
- `src/components/event/RegisterButton.tsx` - Registration action

**Ticket Management:**

- `src/pages/tickets/index.tsx` - User'ın ticket listesi
- `src/pages/tickets/[id].tsx` - Ticket detay ve QR code
- `src/components/ticket/TicketCard.tsx` - Ticket display
- `src/components/ticket/QRCode.tsx` - QR code generator (qrcode.react veya benzeri)

### 1.4 Backend Services

**Walrus Integration:**

- `src/lib/walrus/client.ts` - Walrus client setup
- `src/lib/walrus/storage.ts` - Event metadata upload (title, description, image, etc.)
  - Blob storage ve URL döndürme
  - Metadata retrieval

**Seal Integration (MVP'de temel):**

- `src/lib/seal/client.ts` - Seal client setup
- `src/lib/seal/encryption.ts` - Encryption/decryption helpers
  - Encryption key management
  - Ticket metadata encryption (location, access link)
  - Decryption (sadece ticket holder için)

**API Services (Vite Proxy veya Ayrı Server):**

- `services/api/events.ts` - Event CRUD operations
- `services/api/tickets.ts` - Ticket metadata operations
- Vite proxy config: `vite.config.ts` içinde API proxy ayarları (gerekirse)

### 1.5 Blockchain Entegrasyonu

**Sui SDK Integration:**

- `@mysten/dapp-kit` zaten template'de dahil (SuiClientProvider, useSuiClient)
- `src/lib/sui/contracts.ts` - Contract interaction helpers
- `src/lib/sui/transactions.ts` - Transaction building ve signing
- `src/lib/sui/queries.ts` - Event/ticket query functions

**Contract Interactions:**

- Event creation transaction
- Ticket minting transaction
- Attendance verification transaction
- Event/ticket query functions

### 1.6 Temel Özellikler

**Event Creation:**

- Form ile event metadata girişi
- Walrus'a metadata upload
- Sui'de event object creation
- Event listing ve filtering

**Registration:**

- Wallet ile registration
- Payment handling (Sui native token)
- Ticket NFT minting
- Confirmation gösterimi

**Ticket Viewing:**

- Wallet'dan ticket NFT'leri listeleme
- Ticket detayları (encrypted metadata decrypt)
- QR code generation
- Calendar file (ICS) download

**Attendance (Temel):**

- QR code scanning interface
- Ticket validation
- Attendance NFT minting

## Aşama 2: Gelişmiş Özellikler

### 2.1 ZkLogin Entegrasyonu

- Google/Apple/Email ile login
- Wallet-less onboarding
- `src/lib/sui/zklogin.ts` - ZkLogin helper functions

### 2.2 Walrus Sites Entegrasyonu

- Event-specific Walrus Site creation
- Dynamic content (agenda, speakers, media)
- Access control (sadece ticket holder)
- `src/components/event/EventSite.tsx` - Embedded site viewer

### 2.3 Gelişmiş Ticket Özellikleri

- Dynamic ticket updates (status, RSVP)
- Ticket transfer/resale
- Discount code management
- Multi-tier tickets

### 2.4 Communication System

- Email notifications (reminders, updates)
- Wallet notifications
- Event chat/announcements
- `services/notifications.ts`

### 2.5 Analytics & Reporting

- Organizer dashboard (attendance, sales)
- Anonymized data export
- Tax reports
- `src/pages/organizer/analytics.tsx`

## Aşama 3: Extended Features

### 3.1 Networking & Lead Capture

- Opt-in profile sharing
- Wallet-based reputation links
- Post-event follow-ups

### 3.2 Multi-Track Events

- Multiple ticket tiers
- Different agendas per tier
- Complex registration flows

### 3.3 Badge Printing & Check-in

- Badge design tool
- QR/NFC validation
- Check-in interface for organizers

### 3.4 Ecosystem Integrations

- Airdrop integration points
- Loyalty program hooks
- Sponsor activation APIs

## Güvenlik ve Best Practices

- **Smart Contract Security**: Audit-ready code, input validation, access controls
- **Encryption**: Seal ile proper key management
- **Privacy**: Encrypted metadata, user data control
- **Error Handling**: Comprehensive error boundaries ve user feedback
- **Testing**: Unit, integration, ve E2E testler
- **Documentation**: Code comments, API docs, user guides

## Deployment Stratejisi

- **Smart Contracts**: Sui testnet → mainnet deployment
- **Frontend**: Vercel/Netlify (Vite optimized, static hosting)
- **Backend Services**: 
  - Option 1: Vite proxy ile client-side API calls (Walrus/Seal direkt frontend'den)
  - Option 2: Ayrı API server (Express/Fastify) - Railway, Render, Fly.io
- **Environment Variables**: Sui RPC endpoints, Walrus/Seal API keys, network config

## Notlar

- MVP'de Seal encryption temel seviyede, Aşama 2'de tam entegrasyon
- ZkLogin MVP'de opsiyonel, Aşama 2'de zorunlu
- Responsive design tüm aşamalarda öncelikli
- TypeScript strict mode aktif
- Clean code principles (SOLID, DRY, KISS)

## TODO Listesi

1. ✅ Proje yapısını oluştur: @mysten/create-dapp ile Vite+React projesi başlat (react-e2e-counter template), Move contracts klasörü, services yapısı
2. ⏳ Sui Move smart contracts yaz: event.move, ticket.move, attendance.move - temel struct'lar ve fonksiyonlar
3. ⏳ @mysten/dapp-kit zaten dahil, wallet connection ve transaction signing yapılandırması, ZkLogin hazırlığı
4. ⏳ Walrus storage service: client setup, metadata upload/download, blob management (src/lib/walrus/)
5. ⏳ Seal encryption service: client setup, ticket metadata encryption/decryption, key management (src/lib/seal/)
6. ⏳ Event management UI: creation form, listing, detail pages (organizer ve attendee views) - React Router ile routing
7. ⏳ Ticket UI: ticket listing, detail view, QR code generation, encrypted metadata display
8. ⏳ Registration flow: event selection, payment, ticket NFT minting, confirmation
9. ⏳ Temel attendance tracking: QR scanning, validation, attendance NFT minting
10. ⏳ Test coverage: Move contract tests, frontend component tests, integration tests

