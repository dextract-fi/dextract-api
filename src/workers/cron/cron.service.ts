// src/workers/cron/cron.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainId } from '@exchange/constants/chains.constants';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly pricesService: PricesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshTokens() {
    this.logger.log('Refreshing token lists');
    
    try {
      const chainIds = Object.values(ChainId).filter(id => typeof id === 'number') as number[];
      
      for (const chainId of chainIds) {
        await this.tokensService.refreshTokens(chainId as ChainId);
        this.logger.log(`Refreshed tokens for chain ${chainId}`);
      }
    } catch (error) {
      this.logger.error(`Error refreshing tokens: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshPrices() {
    this.logger.log('Refreshing token prices');
    
    try {
      const chainIds = Object.values(ChainId).filter(id => typeof id === 'number') as number[];
      
      for (const chainId of chainIds) {
        await this.pricesService.refreshPrices(chainId as ChainId);
        this.logger.log(`Refreshed prices for chain ${chainId}`);
      }
    } catch (error) {
      this.logger.error(`Error refreshing prices: ${error.message}`);
    }
  }
}