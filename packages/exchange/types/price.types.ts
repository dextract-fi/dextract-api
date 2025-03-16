export interface TokenPrice {
  address: string;
  priceUsd: number;
  timestamp: number;
  change24h?: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
}

export interface PriceResponse {
  prices: Record<string, TokenPrice>;
  updatedAt: number;
}
