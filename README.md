# Dextract-fi API

A chain-agnostic API for token information and prices, designed to be deployed to Cloudflare Workers.

## Features

- **Chain-Agnostic Architecture**: Support for multiple blockchains (Ethereum, Solana, etc.) and networks (mainnet, testnet, etc.)
- **Flexible API Integration**: Adapters for multiple token and price data providers (CoinGecko, CoinMarketCap, etc.)
- **Efficient Caching**: Intelligent caching with Cloudflare KV for optimal performance
- **Token List Management**: Daily checks for new tokens with indefinite storage
- **Price Updates**: Frequent price updates with configurable TTL
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

- `GET /tokens/:chain/:network` - Get all tokens for a specific chain and network
- `GET /tokens/:chain/:network/:tokenId` - Get a specific token by address or symbol

### Price Endpoints

- `GET /prices/:chain/:network` - Get all token prices for a specific chain and network
- `GET /prices/:chain/:network/:tokenId` - Get price for a specific token

### Legacy Endpoints (Deprecated)

- `GET /tokens/:chainId` - Get all tokens for a specific chain ID
- `GET /tokens/:chainId/:address` - Get a specific token by chain ID and address
- `GET /prices/:chainId` - Get all token prices for a specific chain ID
- `GET /prices/:chainId/:address` - Get price for a specific token by chain ID and address

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