/**
 * Chain and network types for a chain-agnostic architecture
 */

/**
 * Supported blockchain networks
 */
export type ChainType = 'ethereum' | 'solana' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche';

/**
 * Network types for each chain
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

/**
 * Chain identifier with chain type and network
 */
export interface ChainIdentifier {
  chain: ChainType;
  network: NetworkType;
}

/**
 * Chain configuration
 */
export interface ChainConfig {
  name: string;
  chainType: ChainType;
  networkType: NetworkType;
  rpcUrls: string[];
  explorerUrl?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Chain adapter interface for chain-specific operations
 */
export interface ChainAdapter {
  /**
   * Get the chain identifier
   */
  getChainIdentifier(): ChainIdentifier;
  
  /**
   * Get the chain configuration
   */
  getChainConfig(): ChainConfig;
  
  /**
   * Normalize an address for the specific chain
   * @param address The address to normalize
   */
  normalizeAddress(address: string): string;
  
  /**
   * Validate an address for the specific chain
   * @param address The address to validate
   */
  isValidAddress(address: string): boolean;
  
  /**
   * Get the chain-specific token identifier
   * @param symbol The token symbol
   * @param address Optional token address
   */
  getTokenIdentifier(symbol: string, address?: string): string;
}

/**
 * Chain adapter factory interface
 */
export interface ChainAdapterFactory {
  /**
   * Get a chain adapter for the specified chain and network
   * @param chain The chain type
   * @param network The network type
   */
  getAdapter(chain: ChainType, network: NetworkType): ChainAdapter;
  
  /**
   * Get all supported chain adapters
   */
  getAllAdapters(): ChainAdapter[];
  
  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainType[];
  
  /**
   * Get supported networks for a specific chain
   * @param chain The chain type
   */
  getSupportedNetworks(chain: ChainType): NetworkType[];
}