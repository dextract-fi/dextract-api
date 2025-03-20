/**
 * Token API adapter factory
 */
import { Injectable } from '@nestjs/common';
import { ApiAdapterFactory } from '../base-api.adapter';
import { ApiProviderType, TokenApiAdapter } from '@common/types/api-adapter.types';
import { CoinGeckoTokenAdapter } from './coingecko-token.adapter';
import { HttpService } from '@nestjs/axios';

/**
 * Factory for creating and managing token API adapters
 */
@Injectable()
export class TokenApiAdapterFactory extends ApiAdapterFactory<TokenApiAdapter> {
  constructor(private readonly httpService: HttpService) {
    // Set CoinGecko as the default provider
    super('coingecko');
    
    // Register the CoinGecko adapter
    this.registerAdapter('coingecko', new CoinGeckoTokenAdapter(httpService));
  }

  /**
   * Register a custom token API adapter
   * @param provider The API provider type
   * @param adapter The token API adapter
   */
  override registerAdapter(provider: ApiProviderType, adapter: TokenApiAdapter): void {
    super.registerAdapter(provider, adapter);
  }
}