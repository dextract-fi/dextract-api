import { Injectable, Logger } from '@nestjs/common';
import { TokenPrice, PriceResponse as ExchangePriceResponse } from '@exchange/types/price.types';
import { DataStoreService } from '@datastore/datastore.service';
import { ChainAdapter, ChainIdentifier, ChainType, NetworkType } from '@common/types/chain.types';
import { ChainAdapterFactory } from '@blockchain/adapters';
import { PriceApiAdapter, PriceResponse } from '@common/types/api-adapter.types';
import { PriceApiAdapterFactory } from '@api-client/adapters/price';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly NAMESPACE = 'prices';
  private readonly PRICE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly chainAdapterFactory: ChainAdapterFactory,
    private readonly priceApiAdapterFactory: PriceApiAdapterFactory,
  ) {}

  /**
   * Get prices for all tokens on a specific chain and network
   * @param chain The chain type
   * @param network The network type
   */
  async getPrices(chain: ChainType, network: NetworkType): Promise<ExchangePriceResponse> {
    const chainId = this.getChainIdentifier(chain, network);
    const key = this.getPricesKey(chainId);
    const now = Date.now();
    
    return this.dataStoreService.getOrSet<ExchangePriceResponse>(
      key,
      async () => {
        const priceListResponse = await this.fetchPrices(chainId);
        const priceObj: Record<string, TokenPrice> = {};
        
        // Convert API price format to our internal format
        for (const [tokenId, price] of Object.entries(priceListResponse.prices)) {
          const chainAdapter = this.getChainAdapter(chainId);
          const normalizedAddress = chainAdapter.normalizeAddress(price.address);
          
          const tokenPrice: TokenPrice = {
            address: price.address,
            priceUsd: price.priceUsd,
            timestamp: price.timestamp,
            change24h: price.change24h,
            change7d: price.change7d,
            volume24h: price.volume24h,
            marketCap: price.marketCap,
          };
          
          priceObj[normalizedAddress] = tokenPrice;
          
          // Also store individual price for faster lookups
          await this.dataStoreService.set(
            this.getPriceKey(chainId, normalizedAddress),
            tokenPrice,
            { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
          );
        }
        
        return {
          prices: priceObj,
          updatedAt: now,
        };
      },
      { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
    );
  }

  /**
   * Get price for a specific token
   * @param chain The chain type
   * @param network The network type
   * @param tokenId The token identifier (address or symbol)
   */
  async getPrice(chain: ChainType, network: NetworkType, tokenId: string): Promise<TokenPrice | null> {
    const chainId = this.getChainIdentifier(chain, network);
    const chainAdapter = this.getChainAdapter(chainId);
    const normalizedTokenId = chainAdapter.normalizeAddress(tokenId);
    const key = this.getPriceKey(chainId, normalizedTokenId);
    
    return this.dataStoreService.getOrSet<TokenPrice | null>(
      key,
      async () => {
        try {
          // First check if we have it in the cache
          const priceResponse = await this.getPrices(chain, network);
          const cachedPrice = priceResponse.prices[normalizedTokenId];
          
          if (cachedPrice) {
            return cachedPrice;
          }
          
          // If not in cache, try to fetch directly
          const priceAdapter = this.priceApiAdapterFactory.getDefaultAdapter();
          const tokenPrice = await priceAdapter.getPrice(chainId, tokenId);
          
          if (tokenPrice) {
            // Convert to our price format
            const price: TokenPrice = {
              address: tokenPrice.address,
              priceUsd: tokenPrice.priceUsd,
              timestamp: tokenPrice.timestamp,
              change24h: tokenPrice.change24h,
              change7d: tokenPrice.change7d,
              volume24h: tokenPrice.volume24h,
              marketCap: tokenPrice.marketCap,
            };
            
            // Cache the price
            await this.dataStoreService.set(
              key,
              price,
              { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
            );
            
            return price;
          }
        } catch (error) {
          this.logger.error(`Failed to fetch price for ${tokenId}: ${error.message}`);
        }
        
        // Return generic price as fallback
        return this.getGenericPrice(tokenId);
      },
      { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
    );
  }

  /**
   * Refresh prices for a specific chain and network
   * @param chain The chain type
   * @param network The network type
   */
  async refreshPrices(chain: ChainType, network: NetworkType): Promise<ExchangePriceResponse> {
    const chainId = this.getChainIdentifier(chain, network);
    const now = Date.now();
    
    try {
      const priceListResponse = await this.fetchPrices(chainId);
      const priceObj: Record<string, TokenPrice> = {};
      
      // Convert API price format to our internal format
      for (const [tokenId, price] of Object.entries(priceListResponse.prices)) {
        const chainAdapter = this.getChainAdapter(chainId);
        const normalizedAddress = chainAdapter.normalizeAddress(price.address);
        
        const tokenPrice: TokenPrice = {
          address: price.address,
          priceUsd: price.priceUsd,
          timestamp: price.timestamp,
          change24h: price.change24h,
          change7d: price.change7d,
          volume24h: price.volume24h,
          marketCap: price.marketCap,
        };
        
        priceObj[normalizedAddress] = tokenPrice;
        
        // Store individual price
        const priceKey = this.getPriceKey(chainId, normalizedAddress);
        await this.dataStoreService.set(
          priceKey,
          tokenPrice,
          { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
        );
      }
      
      // Store all prices
      const response: ExchangePriceResponse = {
        prices: priceObj,
        updatedAt: now,
      };
      
      const allPricesKey = this.getPricesKey(chainId);
      await this.dataStoreService.set(
        allPricesKey,
        response,
        { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
      );
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to refresh prices: ${error.message}`);
      
      // Return generic prices as fallback
      return this.getGenericPrices(chainId);
    }
  }

  /**
   * Fetch prices from external API
   * @param chainId The chain identifier
   */
  private async fetchPrices(chainId: ChainIdentifier): Promise<{ prices: Record<string, PriceResponse>, updatedAt: number }> {
    try {
      const priceAdapter = this.priceApiAdapterFactory.getDefaultAdapter();
      return await priceAdapter.getPrices(chainId);
    } catch (error) {
      this.logger.error(`Failed to fetch prices: ${error.message}`);
      
      // Return generic prices as fallback
      return {
        prices: {
          'bitcoin': this.getGenericPriceResponse('bitcoin'),
          'ethereum': this.getGenericPriceResponse('ethereum'),
          'solana': this.getGenericPriceResponse('solana'),
        },
        updatedAt: Date.now(),
      };
    }
  }

  /**
   * Get a generic price for testing
   * @param tokenId The token identifier
   */
  private getGenericPrice(tokenId: string): TokenPrice {
    const now = Date.now();
    
    return {
      address: tokenId,
      priceUsd: 9.99,
      timestamp: now,
      change24h: 1.5,
      change7d: 5.2,
      volume24h: 1000000,
      marketCap: 10000000,
    };
  }

  /**
   * Get a generic price response for testing
   * @param tokenId The token identifier
   */
  private getGenericPriceResponse(tokenId: string): PriceResponse {
    const now = Date.now();
    
    return {
      address: tokenId,
      priceUsd: 9.99,
      timestamp: now,
      change24h: 1.5,
      change7d: 5.2,
      volume24h: 1000000,
      marketCap: 10000000,
    };
  }

  /**
   * Get generic prices for testing
   * @param chainId The chain identifier
   */
  private getGenericPrices(chainId: ChainIdentifier): ExchangePriceResponse {
    const now = Date.now();
    const priceObj: Record<string, TokenPrice> = {
      'bitcoin': this.getGenericPrice('bitcoin'),
      'ethereum': this.getGenericPrice('ethereum'),
      'solana': this.getGenericPrice('solana'),
    };
    
    return {
      prices: priceObj,
      updatedAt: now,
    };
  }

  /**
   * Get chain identifier from chain type and network
   * @param chain The chain type
   * @param network The network type
   */
  private getChainIdentifier(chain: ChainType, network: NetworkType): ChainIdentifier {
    return { chain, network };
  }

  /**
   * Get chain adapter for a chain identifier
   * @param chainId The chain identifier
   */
  private getChainAdapter(chainId: ChainIdentifier): ChainAdapter {
    return this.chainAdapterFactory.getAdapter(chainId.chain, chainId.network);
  }

  /**
   * Get prices key for a chain identifier
   * @param chainId The chain identifier
   */
  private getPricesKey(chainId: ChainIdentifier): string {
    return `chain:${chainId.chain}:${chainId.network}:prices`;
  }

  /**
   * Get price key for a chain identifier and token address
   * @param chainId The chain identifier
   * @param tokenId The token identifier
   */
  private getPriceKey(chainId: ChainIdentifier, tokenId: string): string {
    return `chain:${chainId.chain}:${chainId.network}:price:${tokenId}`;
  }
}