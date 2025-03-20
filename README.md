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
- **Efficient Caching**: Intelligent caching with Cloudflare KV with configurable TTL strategies
- **Token List Management**: Daily checks for new tokens with indefinite storage
- **Price Updates**: Frequent price updates with configurable TTL (5-minute default)
- **Swap Quotes**: Real-time swap quotes across multiple DEX providers
- **Secure Deployment**: Ready for deployment to Cloudflare Workers with proper security headers
- **Local Development**: Docker Compose setup with Miniflare for local Cloudflare simulation
- **Monitoring**: Prometheus and Grafana for metrics and monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Docker and Docker Compose (for local development)
- Cloudflare account (for production deployment)

### Initial Setup

Run the setup script to make all scripts executable and create necessary directories:

```bash
# Make the setup script executable
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh
```

### Configuration

1. Copy the example environment files:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your API keys and configuration

3. For Cloudflare deployment, create a KV namespace in your Cloudflare Workers dashboard and add the ID to your `.env.local` file:
   ```
   KV_NAMESPACE_ID=your_kv_namespace_id
   KV_PREVIEW_NAMESPACE_ID=your_preview_kv_namespace_id
   ```

### Local Development with Docker Compose

The project includes a Docker Compose setup with Miniflare for local development:

```bash
# Start the Docker Compose services
./scripts/docker/start.sh

# View logs
./scripts/docker/logs.sh

# Stop the services
./scripts/docker/stop.sh

# Rebuild the services
./scripts/docker/rebuild.sh
```

### Traditional Development

If you prefer not to use Docker:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm start:dev

# Run tests
pnpm test
```

### Cloudflare Workers Deployment

```bash
# Deploy to development environment
./scripts/cloudflare/deploy.sh development

# Deploy to production environment
./scripts/cloudflare/deploy.sh production

# Manage secrets
./scripts/cloudflare/secrets.sh production set COINGECKO_API_KEY your_api_key

# Extract debug information
./scripts/cloudflare/debug.sh production
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

### Environment Files

- `.env.development` - Development environment configuration
- `.env.production` - Production environment configuration
- `.env.local` - Local overrides (gitignored)

### Environment Variables

- `NODE_ENV`: Environment (development, production, test)
- `API_PORT`: Port for the API server (default: 8787)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
- `DEBUG`: Enable debug mode (true/false)
- `KV_NAMESPACE_ID`: Cloudflare KV namespace ID
- `KV_PREVIEW_NAMESPACE_ID`: Cloudflare KV preview namespace ID
- `COINGECKO_API_KEY`: CoinGecko API key
- `COINMARKETCAP_API_KEY`: CoinMarketCap API key

### Cloudflare KV

The API uses Cloudflare KV for caching with the following namespaces:

- `tokens`: Token information with indefinite TTL
- `prices`: Price information with 5-minute TTL

## Docker Compose Services

The Docker Compose setup includes the following services:

- **dextract-api**: The main API service using Miniflare for Cloudflare simulation
- **monitoring**: Grafana for visualization of metrics
- **prometheus**: Prometheus for metrics collection

## License

This project is licensed under the UNLICENSED License - see the LICENSE file for details.
