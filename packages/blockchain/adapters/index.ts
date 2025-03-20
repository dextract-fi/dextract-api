/**
 * Chain adapters module
 */
import { ChainAdapterFactory } from './base-chain.adapter';
import { EthereumAdapter } from './ethereum.adapter';
import { SolanaAdapter } from './solana.adapter';

/**
 * Create and configure the chain adapter factory
 */
export function createChainAdapterFactory(): ChainAdapterFactory {
  const factory = new ChainAdapterFactory();
  
  // Register Ethereum adapters
  const ethMainnet = EthereumAdapter.createMainnet();
  const ethTestnet = EthereumAdapter.createTestnet();
  const ethLocalnet = EthereumAdapter.createLocalnet();
  
  factory.registerAdapter('ethereum', 'mainnet', ethMainnet);
  factory.registerAdapter('ethereum', 'testnet', ethTestnet);
  factory.registerAdapter('ethereum', 'localnet', ethLocalnet);
  
  // Register Solana adapters
  const solMainnet = SolanaAdapter.createMainnet();
  const solTestnet = SolanaAdapter.createTestnet();
  const solDevnet = SolanaAdapter.createDevnet();
  const solLocalnet = SolanaAdapter.createLocalnet();
  
  factory.registerAdapter('solana', 'mainnet', solMainnet);
  factory.registerAdapter('solana', 'testnet', solTestnet);
  factory.registerAdapter('solana', 'devnet', solDevnet);
  factory.registerAdapter('solana', 'localnet', solLocalnet);
  
  return factory;
}

// Export all chain adapter types and implementations
export * from './base-chain.adapter';
export * from './ethereum.adapter';
export * from './solana.adapter';