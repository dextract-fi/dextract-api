import { Injectable, Logger } from '@nestjs/common';
import { TokenPrice, PriceResponse } from '@common/types/price.types';
import { ChainId } from '@common/constants/chains.constants';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private pricesByChain: Map<ChainId, Map<string, TokenPrice>> = new Map();
  private lastUpdatedByChain: Map<ChainId, number> = new Map();
  
  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    // Initialize price maps
    Object.values(ChainId).forEach(chainId => {
      if (typeof chainId === 'number') {
        this.pricesByChain.set(chainId, new Map());
        this.lastUpdatedByChain.set(chainId, 0);
      }
    });
  }

  async getPrices(chainId: ChainId): Promise<PriceResponse> {
    const now = Date.now();
    const lastUpdated = this.lastUpdatedByChain.get(chainId) || 0;
    
    // Check if cache is stale
    if (now - lastUpdated > this.CACHE_TTL) {
      await this.updatePricesForChain(chainId);
    }
    
    const prices = this.pricesByChain.get(chainId) || new Map();
    const priceObj: Record<string, TokenPrice> = {};
    
    prices.forEach((price, address) => {
      priceObj[address] = price;
    });
    
    return {
      prices: priceObj,
      updatedAt: this.lastUpdatedByChain.get(chainId) || now,
    };
  }

  async getPrice(chainId: ChainId, address: string): Promise<TokenPrice | null> {
    const normalizedAddress = this.normalizeAddress(address, chainId);
    const now = Date.now();
    const lastUpdated = this.lastUpdatedByChain.get(chainId) || 0;
    
    // Check if cache is stale
    if (now - lastUpdated > this.CACHE_TTL) {
      await this.updatePricesForChain(chainId);
    }
    
    return this.pricesByChain.get(chainId)?.get(normalizedAddress) || null;
  }

  async updatePricesForChain(chainId: ChainId): Promise<void> {
    try {
      // This is a placeholder - in the real implementation, 
      // we would fetch from an external API or source
      const prices = await this.fetchPrices(chainId);
      
      const priceMap = new Map<string, TokenPrice>();
      prices.forEach(price => {
        const normalizedAddress = this.normalizeAddress(price.address, chainId);
        priceMap.set(normalizedAddress, price);
      });
      
      this.pricesByChain.set(chainId, priceMap);
      this.lastUpdatedByChain.set(chainId, Date.now());
      
      this.logger.log(`Updated ${priceMap.size} prices for chain ${chainId}`);
    } catch (error) {
      this.logger.error(`Failed to update prices for chain ${chainId}: ${error.message}`);
      throw error;
    }
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
