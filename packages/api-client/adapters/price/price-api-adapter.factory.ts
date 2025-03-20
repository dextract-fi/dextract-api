/**
 * Price API adapter factory
 */
import { Injectable } from '@nestjs/common';
import { ApiAdapterFactory } from '../base-api.adapter';
import { ApiProviderType, PriceApiAdapter } from '@common/types/api-adapter.types';
import { CoinGeckoPriceAdapter } from './coingecko-price.adapter';
import { HttpService } from '@nestjs/axios';

/**
 * Factory for creating and managing price API adapters
 */
@Injectable()
export class PriceApiAdapterFactory extends ApiAdapterFactory<PriceApiAdapter> {
  constructor(private readonly httpService: HttpService) {
    // Set CoinGecko as the default provider
    super('coingecko');
    
    // Register the CoinGecko adapter
    this.registerAdapter('coingecko', new CoinGeckoPriceAdapter(httpService));
  }

  /**
   * Register a custom price API adapter
   * @param provider The API provider type
   * @param adapter The price API adapter
   */
  override registerAdapter(provider: ApiProviderType, adapter: PriceApiAdapter): void {
    super.registerAdapter(provider, adapter);
  }
}