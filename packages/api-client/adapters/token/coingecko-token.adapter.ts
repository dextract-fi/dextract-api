/**
 * CoinGecko token API adapter implementation
 */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseApiAdapter } from '../base-api.adapter';
import { TokenApiAdapter, TokenListResponse, TokenResponse } from '@common/types/api-adapter.types';
import { ChainIdentifier } from '@common/types/chain.types';

/**
 * CoinGecko chain ID mapping
 */
const COINGECKO_CHAIN_IDS: Record<string, string> = {
  'ethereum:mainnet': 'ethereum',
  'solana:mainnet': 'solana',
  'bsc:mainnet': 'binance-smart-chain',
  'polygon:mainnet': 'polygon-pos',
  'arbitrum:mainnet': 'arbitrum-one',
  'optimism:mainnet': 'optimistic-ethereum',
  'avalanche:mainnet': 'avalanche',
};

/**
 * CoinGecko token API adapter
 */
@Injectable()
export class CoinGeckoTokenAdapter extends BaseApiAdapter implements TokenApiAdapter {
  constructor(httpService: HttpService) {
    super(httpService, {
      provider: 'coingecko',
      baseUrl: 'https://api.coingecko.com/api/v3',
      rateLimit: {
        maxRequests: 10,
        perTimeWindow: 60 * 1000, // 10 requests per minute for free tier
      },
      timeout: 10000,
    });
  }

  /**
   * Get the CoinGecko chain ID for a chain identifier
   * @param chainId The chain identifier
   */
  private getCoingeckoChainId(chainId: ChainIdentifier): string {
    const key = `${chainId.chain}:${chainId.network}`;
    const coingeckoChainId = COINGECKO_CHAIN_IDS[key];
    
    if (!coingeckoChainId) {
      throw new Error(`Unsupported chain: ${key}`);
    }
    
    return coingeckoChainId;
  }

  /**
   * Get a list of tokens for a specific chain
   * @param chainId The chain identifier
   */
  async getTokenList(chainId: ChainIdentifier): Promise<TokenListResponse> {
    try {
      const coingeckoChainId = this.getCoingeckoChainId(chainId);
      
      // Get tokens from CoinGecko
      const response = await this.request<any[]>(
        `/coins/markets`,
        {
          vs_currency: 'usd',
          category: coingeckoChainId,
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
        }
      );
      
      // Transform to our token format
      const tokens: TokenResponse[] = response.map(token => ({
        address: token.id, // Using CoinGecko ID as address for now
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        decimals: 18, // Default for most tokens, would need token_info API for exact value
        logoURI: token.image,
        chainId,
      }));
      
      return {
        name: `${coingeckoChainId.charAt(0).toUpperCase() + coingeckoChainId.slice(1)} Tokens`,
        tokens,
        timestamp: new Date().toISOString(),
        version: {
          major: 1,
          minor: 0,
          patch: 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get token list: ${error.message}`);
    }
  }

  /**
   * Get information for a specific token
   * @param chainId The chain identifier
   * @param tokenId The token identifier (symbol or address)
   */
  async getToken(chainId: ChainIdentifier, tokenId: string): Promise<TokenResponse | null> {
    try {
      // For CoinGecko, we'll try to get the token by ID first
      const response = await this.request<any>(
        `/coins/${tokenId}`,
        {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        }
      );
      
      if (!response) {
        return null;
      }
      
      // Transform to our token format
      return {
        address: response.id,
        symbol: response.symbol.toUpperCase(),
        name: response.name,
        decimals: 18, // Default for most tokens
        logoURI: response.image?.large,
        chainId,
      };
    } catch (error) {
      // If we can't find by ID, try to search
      try {
        const searchResponse = await this.request<any>(
          `/search`,
          { query: tokenId }
        );
        
        if (!searchResponse.coins || searchResponse.coins.length === 0) {
          return null;
        }
        
        // Find the first coin that matches our chain
        const coingeckoChainId = this.getCoingeckoChainId(chainId);
        const coin = searchResponse.coins.find((c: any) => 
          c.platforms && Object.keys(c.platforms).includes(coingeckoChainId)
        );
        
        if (!coin) {
          return null;
        }
        
        // Get detailed information
        return this.getToken(chainId, coin.id);
      } catch (searchError) {
        return null;
      }
    }
  }
}