/**
 * Base API adapter implementation
 */
import { ApiAdapter, ApiAdapterConfig, ApiProviderType } from '@common/types/api-adapter.types';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

/**
 * Abstract base class for API adapters
 */
@Injectable()
export abstract class BaseApiAdapter implements ApiAdapter {
  protected config: ApiAdapterConfig;
  protected lastRequestTime: number = 0;

  constructor(
    protected readonly httpService: HttpService,
    config: ApiAdapterConfig
  ) {
    this.config = config;
  }

  /**
   * Get the adapter configuration
   */
  getConfig(): ApiAdapterConfig {
    return this.config;
  }

  /**
   * Make a request to the external API
   * @param endpoint The API endpoint
   * @param params The request parameters
   * @param options Additional request options
   */
  async request<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    }
  ): Promise<T> {
    const method = options?.method || 'GET';
    
    // Respect rate limits if configured
    if (this.config.rateLimit) {
      await this.respectRateLimit();
    }
    
    const requestConfig: any = {
      url: `${this.config.baseUrl}${endpoint}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
    };
    
    // Add API key if available
    if (this.config.apiKey) {
      requestConfig.headers = {
        ...requestConfig.headers,
        'Authorization': `Bearer ${this.config.apiKey}`,
      };
    }
    
    // Add params or data based on request method
    if (method === 'GET') {
      requestConfig.params = params;
    } else {
      requestConfig.data = options?.body || params;
    }
    
    try {
      // Use firstValueFrom to convert Observable to Promise
      const response = await firstValueFrom(
        this.httpService.request<T>(requestConfig)
      );
      
      this.lastRequestTime = Date.now();
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data 
        ? `API request failed: ${error.message} - ${JSON.stringify(error.response.data)}`
        : `API request failed: ${error.message}`;
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Respect rate limits by waiting if necessary
   */
  private async respectRateLimit(): Promise<void> {
    if (!this.config.rateLimit) {
      return;
    }
    
    const { maxRequests, perTimeWindow } = this.config.rateLimit;
    const now = Date.now();
    const timeElapsed = now - this.lastRequestTime;
    
    // If we've made a request recently, we need to wait
    if (timeElapsed < perTimeWindow / maxRequests) {
      const waitTime = Math.ceil(perTimeWindow / maxRequests - timeElapsed);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Generic API adapter factory
 */
@Injectable()
export class ApiAdapterFactory<T extends ApiAdapter> {
  private adapters: Map<ApiProviderType, T> = new Map();
  private defaultProvider: ApiProviderType;

  constructor(defaultProvider: ApiProviderType) {
    this.defaultProvider = defaultProvider;
  }

  /**
   * Register an adapter for a provider
   * @param provider The API provider type
   * @param adapter The adapter instance
   */
  registerAdapter(provider: ApiProviderType, adapter: T): void {
    this.adapters.set(provider, adapter);
  }

  /**
   * Get an adapter for the specified provider
   * @param provider The API provider type
   */
  getAdapter(provider: ApiProviderType): T {
    const adapter = this.adapters.get(provider);
    
    if (!adapter) {
      throw new Error(`No adapter registered for provider ${provider}`);
    }
    
    return adapter;
  }

  /**
   * Get the default adapter
   */
  getDefaultAdapter(): T {
    return this.getAdapter(this.defaultProvider);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): T[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all supported providers
   */
  getSupportedProviders(): ApiProviderType[] {
    return Array.from(this.adapters.keys());
  }
}