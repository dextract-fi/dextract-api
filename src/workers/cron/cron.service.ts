import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { ChainAdapterFactory } from '@blockchain/adapters';
import { ChainType, NetworkType } from '@common/types/chain.types';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly pricesService: PricesService,
    private readonly chainAdapterFactory: ChainAdapterFactory,
  ) {}

  /**
   * Check for new tokens every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkForNewTokens() {
    this.logger.log('Checking for new tokens');
    
    try {
      // Get all supported chains and networks
      const chains = this.chainAdapterFactory.getSupportedChains();
      
      for (const chain of chains) {
        const networks = this.chainAdapterFactory.getSupportedNetworks(chain);
        
        for (const network of networks) {
          // Skip testnets and devnets for token checks
          if (network === 'mainnet') {
            await this.tokensService.checkForNewTokens(chain, network);
            this.logger.log(`Checked for new tokens on ${chain}:${network}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking for new tokens: ${error.message}`);
    }
  }

  /**
   * Refresh token prices every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshPrices() {
    this.logger.log('Refreshing token prices');
    
    try {
      // Get all supported chains and networks
      const chains = this.chainAdapterFactory.getSupportedChains();
      
      for (const chain of chains) {
        const networks = this.chainAdapterFactory.getSupportedNetworks(chain);
        
        for (const network of networks) {
          // Skip testnets and devnets for price updates
          if (network === 'mainnet') {
            await this.pricesService.refreshPrices(chain, network);
            this.logger.log(`Refreshed prices for ${chain}:${network}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error refreshing prices: ${error.message}`);
    }
  }

  /**
   * Get supported chain-network pairs
   */
  private getSupportedChainNetworks(): Array<{ chain: ChainType, network: NetworkType }> {
    const result: Array<{ chain: ChainType, network: NetworkType }> = [];
    const chains = this.chainAdapterFactory.getSupportedChains();
    
    for (const chain of chains) {
      const networks = this.chainAdapterFactory.getSupportedNetworks(chain);
      
      for (const network of networks) {
        result.push({ chain, network });
      }
    }
    
    return result;
  }
}