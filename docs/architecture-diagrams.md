# Architecture Diagrams for Dextract-fi API

*[Back to README](../README.md) | [API Documentation](./api-docs.md) | [Architecture Overview](./architecture-flow.md) | [Implementation Summary](./implementation-summary.md)*

This document provides additional visual representations of the Dextract-fi API architecture to complement the diagrams in the [Architecture Overview](./architecture-flow.md).

## Deployment Architecture

```mermaid
flowchart TD
    A[NestJS API] --> B[Cloudflare Workers]
    B --> C[Cloudflare KV]
    D[Frontend] --> B
    B --> E[External APIs]
```

## Chain and Network Architecture

```mermaid
flowchart TD
    A[API Layer] --> B[Chain Adapter Factory]
    B --> C[Ethereum Adapter]
    C --> C1[Ethereum Mainnet]
    C --> C2[Ethereum Testnet]
    B --> D[Solana Adapter]
    D --> D1[Solana Mainnet]
    D --> D2[Solana Testnet]
    D --> D3[Solana Devnet]
    B --> E[Other Chain Adapters...]
    F[Token Service] --> B
    G[Price Service] --> B
    H[Swap Service] --> B
```

## External API Integration Framework

```mermaid
flowchart TD
    A[API Services] --> B[External API Adapter Factory]
    B --> C[Token Data Adapters]
    C --> C1[CoinGecko]
    C --> C2[CoinMarketCap]
    C --> C3[Jupiter]
    B --> D[Price Data Adapters]
    D --> D1[CoinGecko]
    D --> D2[CoinMarketCap]
    D --> D3[Other Price APIs]
    B --> E[Swap Data Adapters]
    E --> E1[1inch]
    E --> E2[Jupiter]
    E --> E3[Other DEX APIs]
    A --> F[Datastore Service]
    F --> G[Cloudflare KV]
```

## Data Type TTL Strategy

```mermaid
flowchart TD
    A[Data Types] --> B[Token Lists]
    A --> C[Token Details]
    A --> D[Price Data]
    A --> E[Swap Quotes]
    
    B --> F[24h TTL, Check for New Tokens]
    C --> G[Indefinite TTL]
    D --> H[5m TTL, Frequent Updates]
    E --> I[No Cache, Real-time Only]