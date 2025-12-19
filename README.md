# Tickert - Decentralized Event Ticketing Platform

A decentralized event registration and ticketing platform powered by Sui blockchain, Walrus storage, and Seal encryption.

## Features

- **Event Creation**: Organizers can create events with metadata stored on Walrus
- **NFT Ticketing**: Tickets are minted as NFTs on Sui blockchain
- **Encrypted Metadata**: Ticket details (location, access links) are encrypted using Seal
- **Attendance Tracking**: QR code-based check-in with on-chain attendance NFTs
- **Wallet Integration**: Full Sui wallet support via @mysten/dapp-kit

## Project Structure

```
tickert/
├── contracts/          # Sui Move smart contracts
│   ├── sources/
│   │   ├── event.move
│   │   ├── ticket.move
│   │   └── attendance.move
│   └── tests/
├── frontend/            # React frontend application
│   └── src/
│       ├── components/
│       ├── lib/
│       ├── pages/
│       └── types/
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- Sui CLI
- Rust (for Move contracts)

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

### Smart Contracts

Deploy contracts to Sui:

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS
- **Blockchain**: Sui Move + @mysten/dapp-kit
- **Storage**: Walrus
- **Encryption**: Seal

## License

MIT

