/**
 * External API adapter types for a flexible API integration framework
 */
import { ChainIdentifier } from './chain.types';

/**
 * External API provider types
 */
export type ApiProviderType = 'coingecko' | 'coinmarketcap' | 'jupiter' | 'custom';

/**
 * External API adapter configuration
 */
export interface ApiAdapterConfig {
  provider: ApiProviderType;
  baseUrl: string;
  apiKey?: string;
  rateLimit?: {
    maxRequests: number;
    perTimeWindow: number; // in milliseconds
  };
  timeout?: number; // in milliseconds
}

/**
 * External API adapter interface
 */
export interface ApiAdapter {
  /**
   * Get the adapter configuration
   */
  getConfig(): ApiAdapterConfig;
  
  /**
   * Make a request to the external API
   * @param endpoint The API endpoint
   * @param params The request parameters
   * @param options Additional request options
   */
  request<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    }
  ): Promise<T>;
}

/**
 * Token API adapter interface
 */
export interface TokenApiAdapter extends ApiAdapter {
  /**
   * Get a list of tokens for a specific chain and network
   * @param chainId The chain identifier
   */
  getTokenList(chainId: ChainIdentifier): Promise<TokenListResponse>;
  
  /**
   * Get information for a specific token
   * @param chainId The chain identifier
   * @param tokenId The token identifier (symbol or address)
   */
  getToken(chainId: ChainIdentifier, tokenId: string): Promise<TokenResponse | null>;
}

/**
 * Price API adapter interface
 */
export interface PriceApiAdapter extends ApiAdapter {
  /**
   * Get prices for all tokens on a specific chain and network
   * @param chainId The chain identifier
   */
  getPrices(chainId: ChainIdentifier): Promise<PriceListResponse>;
  
  /**
   * Get price for a specific token
   * @param chainId The chain identifier
   * @param tokenId The token identifier (symbol or address)
   */
  getPrice(chainId: ChainIdentifier, tokenId: string): Promise<PriceResponse | null>;
}

/**
 * Swap API adapter interface
 */
export interface SwapApiAdapter extends ApiAdapter {
  /**
   * Get a swap quote
   * @param chainId The chain identifier
   * @param fromTokenId The source token identifier
   * @param toTokenId The destination token identifier
   * @param amount The amount to swap
   * @param options Additional swap options
   */
  getSwapQuote(
    chainId: ChainIdentifier,
    fromTokenId: string,
    toTokenId: string,
    amount: string,
    options?: Record<string, any>
  ): Promise<SwapQuoteResponse>;
}

/**
 * API adapter factory interface
 */
export interface ApiAdapterFactory<T extends ApiAdapter> {
  /**
   * Get an adapter for the specified provider
   * @param provider The API provider type
   */
  getAdapter(provider: ApiProviderType): T;
  
  /**
   * Get the default adapter
   */
  getDefaultAdapter(): T;
  
  /**
   * Register a new adapter
   * @param provider The API provider type
   * @param adapter The adapter instance
   */
  registerAdapter(provider: ApiProviderType, adapter: T): void;
}

/**
 * Token list response
 */
export interface TokenListResponse {
  name: string;
  logoURI?: string;
  tokens: TokenResponse[];
  timestamp: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

/**
 * Token response
 */
export interface TokenResponse {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  chainId: ChainIdentifier;
}

/**
 * Price list response
 */
export interface PriceListResponse {
  prices: Record<string, PriceResponse>;
  updatedAt: number;
}

/**
 * Price response
 */
export interface PriceResponse {
  address: string;
  priceUsd: number;
  timestamp: number;
  change24h?: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
}

/**
 * Swap quote response
 */
export interface SwapQuoteResponse {
  fromToken: {
    address: string;
    symbol: string;
    amount: string;
  };
  toToken: {
    address: string;
    symbol: string;
    amount: string;
  };
  route: {
    path: string[];
    provider: string;
  };
  price: number;
  priceImpact: number;
  estimatedGas?: string;
  fee?: {
    amount: string;
    currency: string;
  };
  validUntil: number;
}