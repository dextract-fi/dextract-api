import { Injectable, Logger } from '@nestjs/common';
import { SwapQuote, SwapRoute } from '@exchange/types/swap.types';
import { ChainType, NetworkType } from '@common/types/chain.types';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { DataStoreService } from '@datastore/datastore.service';

@Injectable()
export class SwapsService {
  private readonly logger = new Logger(SwapsService.name);
  private readonly NAMESPACE = 'swaps';
  private readonly QUOTE_TTL = 30 * 1000; // 30 seconds

  constructor(
    private readonly tokensService: TokensService,
    private readonly pricesService: PricesService,
    private readonly dataStoreService: DataStoreService,
  ) {}

  async getQuote(
    chain: ChainType,
    network: NetworkType,
    fromToken: string,
    toToken: string,
    amount: string,
  ): Promise<SwapQuote> {
    this.logger.log(`Getting quote for ${amount} ${fromToken} to ${toToken} on chain ${chain}:${network}`);
    
    // Use a deterministic key for caching based on all parameters
    const key = `chain:${chain}:${network}:quote:${fromToken}:${toToken}:${amount}`;
    
    return this.dataStoreService.getOrSet<SwapQuote>(
      key,
      async () => {
        // Validate tokens exist
        const sourceToken = await this.tokensService.getToken(chain, network, fromToken);
        const destinationToken = await this.tokensService.getToken(chain, network, toToken);
        
        if (!sourceToken || !destinationToken) {
          throw new Error('One or both tokens not found');
        }
        
        // Fetch routes
        const routes = await this.fetchRoutes(
          chain,
          network,
          sourceToken.address,
          destinationToken.address,
          amount,
        );
        
        if (routes.length === 0) {
          throw new Error('No routes found');
        }
        
        // Find the best route (highest toAmount)
        const bestRoute = routes.reduce((best, current) => {
          const bestAmount = BigInt(best.toAmount);
          const currentAmount = BigInt(current.toAmount);
          return currentAmount > bestAmount ? current : best;
        });
        
        return {
          routes,
          bestRoute,
          fromToken: sourceToken.address,
          toToken: destinationToken.address,
          fromAmount: amount,
          updatedAt: Date.now(),
        };
      },
      { namespace: this.NAMESPACE, ttl: this.QUOTE_TTL }
    );
  }

  private async fetchRoutes(
    chain: ChainType,
    network: NetworkType,
    fromToken: string,
    toToken: string,
    amount: string,
  ): Promise<SwapRoute[]> {
    // Placeholder - implement actual routing logic
    // This could involve fetching from 1inch, 0x, Jupiter, etc.
    
    // Dummy route for demonstration
    const route: SwapRoute = {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: '0', // This would be calculated
      priceImpact: 0.01,
      path: [fromToken, toToken],
      providers: ['Example DEX'],
    };
    
    return [route];
  }
}