/**
 * Base chain adapter implementation
 */
import { ChainAdapter, ChainConfig, ChainIdentifier, ChainType, NetworkType } from '@common/types/chain.types';

/**
 * Abstract base class for chain adapters
 */
export abstract class BaseChainAdapter implements ChainAdapter {
  protected config: ChainConfig;

  constructor(config: ChainConfig) {
    this.config = config;
  }

  /**
   * Get the chain identifier
   */
  getChainIdentifier(): ChainIdentifier {
    return {
      chain: this.config.chainType,
      network: this.config.networkType,
    };
  }

  /**
   * Get the chain configuration
   */
  getChainConfig(): ChainConfig {
    return this.config;
  }

  /**
   * Normalize an address for the specific chain
   * This method should be overridden by chain-specific adapters
   * @param address The address to normalize
   */
  abstract normalizeAddress(address: string): string;

  /**
   * Validate an address for the specific chain
   * This method should be overridden by chain-specific adapters
   * @param address The address to validate
   */
  abstract isValidAddress(address: string): boolean;

  /**
   * Get the chain-specific token identifier
   * This method should be overridden by chain-specific adapters
   * @param symbol The token symbol
   * @param address Optional token address
   */
  abstract getTokenIdentifier(symbol: string, address?: string): string;
}

/**
 * Chain adapter factory implementation
 */
export class ChainAdapterFactory {
  private adapters: Map<string, ChainAdapter> = new Map();

  /**
   * Register a chain adapter
   * @param chain The chain type
   * @param network The network type
   * @param adapter The chain adapter
   */
  registerAdapter(chain: ChainType, network: NetworkType, adapter: ChainAdapter): void {
    const key = this.getAdapterKey(chain, network);
    this.adapters.set(key, adapter);
  }

  /**
   * Get a chain adapter for the specified chain and network
   * @param chain The chain type
   * @param network The network type
   */
  getAdapter(chain: ChainType, network: NetworkType): ChainAdapter {
    const key = this.getAdapterKey(chain, network);
    const adapter = this.adapters.get(key);
    
    if (!adapter) {
      throw new Error(`No adapter registered for chain ${chain} and network ${network}`);
    }
    
    return adapter;
  }

  /**
   * Get all registered chain adapters
   */
  getAllAdapters(): ChainAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainType[] {
    const chains = new Set<ChainType>();
    
    for (const adapter of this.adapters.values()) {
      chains.add(adapter.getChainIdentifier().chain);
    }
    
    return Array.from(chains);
  }

  /**
   * Get supported networks for a specific chain
   * @param chain The chain type
   */
  getSupportedNetworks(chain: ChainType): NetworkType[] {
    const networks = new Set<NetworkType>();
    
    for (const adapter of this.adapters.values()) {
      const identifier = adapter.getChainIdentifier();
      
      if (identifier.chain === chain) {
        networks.add(identifier.network);
      }
    }
    
    return Array.from(networks);
  }

  /**
   * Get the adapter key for a chain and network
   * @param chain The chain type
   * @param network The network type
   */
  private getAdapterKey(chain: ChainType, network: NetworkType): string {
    return `${chain}:${network}`;
  }
}