/**
 * Solana chain adapter implementation
 */
import { ChainType, NetworkType, ChainConfig } from '@common/types/chain.types';
import { BaseChainAdapter } from './base-chain.adapter';

/**
 * Solana chain adapter
 */
export class SolanaAdapter extends BaseChainAdapter {
  /**
   * Create Solana mainnet adapter
   */
  static createMainnet(): SolanaAdapter {
    return new SolanaAdapter({
      name: 'Solana Mainnet',
      chainType: 'solana',
      networkType: 'mainnet',
      rpcUrls: [
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.rpc.extrnode.com',
      ],
      explorerUrl: 'https://explorer.solana.com',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9,
      },
    });
  }

  /**
   * Create Solana testnet adapter
   */
  static createTestnet(): SolanaAdapter {
    return new SolanaAdapter({
      name: 'Solana Testnet',
      chainType: 'solana',
      networkType: 'testnet',
      rpcUrls: [
        'https://api.testnet.solana.com',
      ],
      explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9,
      },
    });
  }

  /**
   * Create Solana devnet adapter
   */
  static createDevnet(): SolanaAdapter {
    return new SolanaAdapter({
      name: 'Solana Devnet',
      chainType: 'solana',
      networkType: 'devnet',
      rpcUrls: [
        'https://api.devnet.solana.com',
      ],
      explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9,
      },
    });
  }

  /**
   * Create Solana local development network adapter
   */
  static createLocalnet(): SolanaAdapter {
    return new SolanaAdapter({
      name: 'Solana Local',
      chainType: 'solana',
      networkType: 'localnet',
      rpcUrls: [
        'http://localhost:8899',
      ],
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9,
      },
    });
  }

  constructor(config: ChainConfig) {
    super(config);
  }

  /**
   * Normalize a Solana address
   * @param address The address to normalize
   */
  normalizeAddress(address: string): string {
    // Solana addresses are case-sensitive, so we don't modify them
    return address;
  }

  /**
   * Validate a Solana address
   * @param address The address to validate
   */
  isValidAddress(address: string): boolean {
    // Basic Solana address validation (base58 encoding, typically 32-44 characters)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  /**
   * Get the Solana token identifier
   * @param symbol The token symbol
   * @param address Optional token address (mint address)
   */
  getTokenIdentifier(symbol: string, address?: string): string {
    // For Solana, we prefer the mint address as the identifier if available
    if (address && this.isValidAddress(address)) {
      return address;
    }
    
    // Otherwise, use the symbol
    return symbol.toUpperCase();
  }
}