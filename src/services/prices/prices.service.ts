import { Injectable, Logger } from '@nestjs/common';
import { TokenPrice, PriceResponse } from '@exchange/types/price.types';
import { ChainId } from '@exchange/constants/chains.constants';
import { DataStoreService } from '@datastore/datastore.service';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly NAMESPACE = 'prices';
  private readonly PRICE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly dataStoreService: DataStoreService) {}

  async getPrices(chainId: ChainId): Promise<PriceResponse> {
    const key = `chain:${chainId}:prices`;
    const now = Date.now();
    
    return this.dataStoreService.getOrSet<PriceResponse>(
      key,
      async () => {
        const prices = await this.fetchPrices(chainId);
        const priceObj: Record<string, TokenPrice> = {};
        
        for (const price of prices) {
          const normalizedAddress = this.normalizeAddress(price.address, chainId);
          priceObj[normalizedAddress] = price;
          
          // Also store individual price for faster lookups
          await this.dataStoreService.set(
            `chain:${chainId}:price:${normalizedAddress}`,
            price,
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

  async getPrice(chainId: ChainId, address: string): Promise<TokenPrice | null> {
    const normalizedAddress = this.normalizeAddress(address, chainId);
    const key = `chain:${chainId}:price:${normalizedAddress}`;
    
    return this.dataStoreService.getOrSet<TokenPrice | null>(
      key,
      async () => {
        // If individual price is not cached, try to get from all prices
        const priceResponse = await this.getPrices(chainId);
        return priceResponse.prices[normalizedAddress] || null;
      },
      { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
    );
  }

  async refreshPrices(chainId: ChainId): Promise<PriceResponse> {
    const now = Date.now();
    const prices = await this.fetchPrices(chainId);
    const priceObj: Record<string, TokenPrice> = {};
    
    // Store the prices response
    const response: PriceResponse = {
      prices: priceObj,
      updatedAt: now,
    };
    
    // Store individual prices
    await Promise.all(prices.map(async (price) => {
      const normalizedAddress = this.normalizeAddress(price.address, chainId);
      priceObj[normalizedAddress] = price;
      
      const priceKey = `chain:${chainId}:price:${normalizedAddress}`;
      await this.dataStoreService.set(
        priceKey,
        price,
        { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
      );
    }));
    
    // Store all prices
    const allPricesKey = `chain:${chainId}:prices`;
    await this.dataStoreService.set(
      allPricesKey,
      response,
      { namespace: this.NAMESPACE, ttl: this.PRICE_TTL }
    );
    
    return response;
  }

  private async fetchPrices(chainId: ChainId): Promise<TokenPrice[]> {
    // Placeholder - implement actual fetching logic
    // This could be from an external API like CoinGecko, CoinMarketCap, etc.
    return [];
  }

  private normalizeAddress(address: string, chainId: ChainId): string {
    // Normalize address based on chain
    // For Ethereum, convert to lowercase
    // For Solana, leave as is (case-sensitive)
    if (chainId === ChainId.ETHEREUM) {
      return address.toLowerCase();
    }
    return address;
  }
}