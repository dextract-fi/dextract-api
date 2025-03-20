# Dextract-fi API

A chain-agnostic API for token information and prices, designed to be deployed to Cloudflare Workers.

## Documentation

- [API Documentation](docs/api-docs.md) - Comprehensive guide to API endpoints and usage
- [Architecture Overview](docs/architecture-flow.md) - Detailed explanation of the system architecture and data flows
- [Architecture Diagrams](docs/architecture-diagrams.md) - Visual representations of the system architecture
- [Implementation Summary](docs/implementation-summary.md) - Overview of the current implementation components

## Features

- **Chain-Agnostic Architecture**: Support for multiple blockchains (Ethereum, Solana, BSC, Polygon, Arbitrum, Optimism, Avalanche) and networks (mainnet, testnet, devnet, localnet)
- **Flexible API Integration**: Adapter pattern for multiple token and price data providers (CoinGecko, CoinMarketCap, etc.)
- **Efficient Caching**: Intelligent caching with Cloudflare KV and in-memory store with configurable TTL strategies
- **Token List Management**: Daily checks for new tokens with indefinite storage
- **Price Updates**: Frequent price updates with configurable TTL (5-minute default)
- **Swap Quotes**: Real-time swap quotes across multiple DEX providers
- **Secure Deployment**: Ready for deployment to Cloudflare Workers with proper security headers

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Cloudflare account (for deployment)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm start:dev

# Run tests
pnpm test
```

### Cloudflare Workers Setup

1. Create a KV namespace in your Cloudflare Workers dashboard
2. Update the `wrangler.toml` file with your KV namespace ID and zone ID
3. Set up your API keys as secrets:

```bash
npx wrangler secret put COINGECKO_API_KEY
npx wrangler secret put COINMARKETCAP_API_KEY
```

### Deployment

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
```

## API Endpoints

### Token Endpoints

- `GET /api/tokens/:chain/:network` - Get all tokens for a specific chain and network
- `GET /api/tokens/:chain/:network/:tokenId` - Get a specific token by address or symbol

### Price Endpoints

- `GET /api/prices/:chain/:network` - Get all token prices for a specific chain and network
- `GET /api/prices/:chain/:network/:tokenId` - Get price for a specific token

### Swap Endpoints

- `GET /api/swaps/quote/:chain/:network?fromToken=&toToken=&amount=` - Get swap quote for a token pair

## Supported Chains and Networks

| Chain | Networks |
|-------|----------|
| ethereum | mainnet, testnet, localnet |
| solana | mainnet, testnet, devnet, localnet |
| bsc | mainnet |
| polygon | mainnet |
| arbitrum | mainnet |
| optimism | mainnet |
| avalanche | mainnet |

## Architecture

The API follows a modular architecture with the following components:

- **Chain Adapters**: Provide chain-specific functionality and address normalization
- **API Adapters**: Connect to external data providers for token and price information
- **Services**: Orchestrate business logic and caching
- **Controllers**: Handle HTTP requests and responses
- **Datastore**: Provides a unified interface to the storage layer with different implementations

### Adapter Pattern

The project uses the adapter pattern to abstract away the specifics of different blockchains and external APIs:

- **Chain Adapters**: Abstract away chain-specific details like address formats and validation
- **API Adapters**: Abstract away external API specifics, allowing easy switching between providers

### Caching Strategy

Different data types have different caching strategies:

- **Token Data**: Cached indefinitely, with daily checks for new tokens
- **Price Data**: Cached with a short TTL (5 minutes by default)
- **Swap Quotes**: Not cached, always fetched in real-time

## Configuration

### Environment Variables

- `NODE_ENV`: Environment (development, production, test)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

### Cloudflare KV

The API uses Cloudflare KV for caching with the following namespaces:

- `tokens`: Token information with indefinite TTL
- `prices`: Price information with 5-minute TTL

## License

This project is licensed under the UNLICENSED License - see the LICENSE file for details.