# Dextract-fi API Documentation

*[Back to README](../README.md) | [Architecture Overview](./architecture-flow.md) | [Architecture Diagrams](./architecture-diagrams.md) | [Implementation Summary](./implementation-summary.md)*

This document provides comprehensive documentation for the Dextract-fi API endpoints.

## Base URL

```
https://api.dextract.fi
```

For local development:

```
http://localhost:3001
```

All endpoints are prefixed with `/api`.

## Authentication

Currently, the API does not require authentication. However, rate limiting may be applied to prevent abuse.

## Response Format

All responses are returned in JSON format. Successful responses will have a 2xx status code, while errors will have a 4xx or 5xx status code.

### Success Response

```json
{
  "data": { ... }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Token Endpoints

### Get All Tokens

Retrieves all tokens for a specific chain and network.

```
GET /api/tokens/:chain/:network
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chain | string | Chain type | ethereum, solana |
| network | string | Network type | mainnet, testnet |

#### Example Request

```
GET /api/tokens/ethereum/mainnet
```

#### Example Response

```json
[
  {
    "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "symbol": "USDC",
    "name": "USD Coin",
    "decimals": 6,
    "logoURI": "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png",
    "tags": ["stablecoin"],
    "chainType": "ethereum",
    "networkType": "mainnet"
  },
  {
    "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "symbol": "WETH",
    "name": "Wrapped Ether",
    "decimals": 18,
    "logoURI": "https://assets.coingecko.com/coins/images/2518/thumb/weth.png",
    "tags": ["wrapped"],
    "chainType": "ethereum",
    "networkType": "mainnet"
  }
]
```

### Get Token by ID

Retrieves a specific token by address or symbol.

```
GET /api/tokens/:chain/:network/:tokenId
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chain | string | Chain type | ethereum, solana |
| network | string | Network type | mainnet, testnet |
| tokenId | string | Token address or symbol | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, USDC |

#### Example Request

```
GET /api/tokens/ethereum/mainnet/USDC
```

#### Example Response

```json
{
  "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "symbol": "USDC",
  "name": "USD Coin",
  "decimals": 6,
  "logoURI": "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png",
  "tags": ["stablecoin"],
  "chainType": "ethereum",
  "networkType": "mainnet"
}
```

### Legacy: Get All Tokens by Chain ID

Retrieves all tokens for a specific chain ID (legacy endpoint).

```
GET /api/tokens/legacy/:chainId
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chainId | string | Chain ID | 1 (Ethereum), 101 (Solana) |

#### Example Request

```
GET /api/tokens/legacy/1
```

### Legacy: Get Token by Chain ID and Address

Retrieves a specific token by chain ID and address (legacy endpoint).

```
GET /api/tokens/legacy/:chainId/:address
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chainId | string | Chain ID | 1 (Ethereum), 101 (Solana) |
| address | string | Token address | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |

#### Example Request

```
GET /api/tokens/legacy/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

## Price Endpoints

### Get All Prices

Retrieves all token prices for a specific chain and network.

```
GET /api/prices/:chain/:network
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chain | string | Chain type | ethereum, solana |
| network | string | Network type | mainnet, testnet |

#### Example Request

```
GET /api/prices/ethereum/mainnet
```

#### Example Response

```json
{
  "prices": {
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "priceUsd": 1.0,
      "timestamp": 1679395200000,
      "change24h": 0.01,
      "volume24h": 1000000000
    },
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
      "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "priceUsd": 3500.0,
      "timestamp": 1679395200000,
      "change24h": 2.5,
      "volume24h": 500000000
    }
  },
  "updatedAt": 1679395200000
}
```

### Get Price by Token ID

Retrieves price for a specific token.

```
GET /api/prices/:chain/:network/:tokenId
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chain | string | Chain type | ethereum, solana |
| network | string | Network type | mainnet, testnet |
| tokenId | string | Token address or symbol | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, USDC |

#### Example Request

```
GET /api/prices/ethereum/mainnet/USDC
```

#### Example Response

```json
{
  "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "priceUsd": 1.0,
  "timestamp": 1679395200000,
  "change24h": 0.01,
  "volume24h": 1000000000
}
```

### Legacy: Get All Prices by Chain ID

Retrieves all token prices for a specific chain ID (legacy endpoint).

```
GET /api/prices/legacy/:chainId
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chainId | string | Chain ID | 1 (Ethereum), 101 (Solana) |

#### Example Request

```
GET /api/prices/legacy/1
```

### Legacy: Get Price by Chain ID and Address

Retrieves price for a specific token by chain ID and address (legacy endpoint).

```
GET /api/prices/legacy/:chainId/:address
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chainId | string | Chain ID | 1 (Ethereum), 101 (Solana) |
| address | string | Token address | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |

#### Example Request

```
GET /api/prices/legacy/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

## Swap Endpoints

### Get Swap Quote

Retrieves a swap quote for a token pair.

```
GET /api/swaps/quote/:chain/:network
```

#### Path Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| chain | string | Chain type | ethereum, solana |
| network | string | Network type | mainnet, testnet |

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| fromToken | string | Source token address | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| toToken | string | Destination token address | 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 |
| amount | string | Amount of source token to swap (in wei/lamports) | 1000000000 |

#### Example Request

```
GET /api/swaps/quote/ethereum/mainnet?fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&amount=1000000000
```

#### Example Response

```json
{
  "routes": [
    {
      "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "fromAmount": "1000000000",
      "toAmount": "285714285714285714",
      "priceImpact": 0.05,
      "path": [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      ],
      "providers": ["Uniswap V3"],
      "estimatedGas": "150000"
    },
    {
      "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "fromAmount": "1000000000",
      "toAmount": "284571428571428571",
      "priceImpact": 0.08,
      "path": [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      ],
      "providers": ["Sushiswap"],
      "estimatedGas": "180000"
    }
  ],
  "bestRoute": {
    "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "fromAmount": "1000000000",
    "toAmount": "285714285714285714",
    "priceImpact": 0.05,
    "path": [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    ],
    "providers": ["Uniswap V3"],
    "estimatedGas": "150000"
  },
  "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "fromAmount": "1000000000",
  "updatedAt": 1679395200000
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed or missing required parameters |
| 404 | Not Found - The requested resource was not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on the server |

## Chain and Network Support

| Chain | Chain Type | Networks |
|-------|-----------|----------|
| Ethereum | ethereum | mainnet, testnet, localnet |
| Solana | solana | mainnet, testnet, devnet, localnet |
| Binance Smart Chain | bsc | mainnet |
| Polygon | polygon | mainnet |
| Arbitrum | arbitrum | mainnet |
| Optimism | optimism | mainnet |
| Avalanche | avalanche | mainnet |

## Legacy Chain ID Mapping

| Chain ID | Chain | Network |
|----------|-------|---------|
| 1 | ethereum | mainnet |
| 101 | solana | mainnet |
| 56 | bsc | mainnet |
| 137 | polygon | mainnet |
| 42161 | arbitrum | mainnet |
| 10 | optimism | mainnet |
| 43114 | avalanche | mainnet |
