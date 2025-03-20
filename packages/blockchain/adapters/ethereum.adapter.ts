/**
 * Ethereum chain adapter implementation
 */
import { ChainType, NetworkType, ChainConfig } from '@common/types/chain.types';
import { BaseChainAdapter } from './base-chain.adapter';

/**
 * Ethereum chain adapter
 */
export class EthereumAdapter extends BaseChainAdapter {
  /**
   * Create Ethereum mainnet adapter
   */
  static createMainnet(): EthereumAdapter {
    return new EthereumAdapter({
      name: 'Ethereum Mainnet',
      chainType: 'ethereum',
      networkType: 'mainnet',
      rpcUrls: [
        'https://eth.llamarpc.com',
        'https://rpc.ankr.com/eth',
      ],
      explorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    });
  }

  /**
   * Create Ethereum testnet (Goerli) adapter
   */
  static createTestnet(): EthereumAdapter {
    return new EthereumAdapter({
      name: 'Ethereum Goerli',
      chainType: 'ethereum',
      networkType: 'testnet',
      rpcUrls: [
        'https://rpc.ankr.com/eth_goerli',
        'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      ],
      explorerUrl: 'https://goerli.etherscan.io',
      nativeCurrency: {
        name: 'Goerli Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    });
  }

  /**
   * Create Ethereum local development network adapter
   */
  static createLocalnet(): EthereumAdapter {
    return new EthereumAdapter({
      name: 'Ethereum Local',
      chainType: 'ethereum',
      networkType: 'localnet',
      rpcUrls: [
        'http://localhost:8545',
      ],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    });
  }

  constructor(config: ChainConfig) {
    super(config);
  }

  /**
   * Normalize an Ethereum address
   * @param address The address to normalize
   */
  normalizeAddress(address: string): string {
    // Convert to lowercase for Ethereum addresses
    return address.toLowerCase();
  }

  /**
   * Validate an Ethereum address
   * @param address The address to validate
   */
  isValidAddress(address: string): boolean {
    // Basic Ethereum address validation (0x followed by 40 hex characters)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get the Ethereum token identifier
   * @param symbol The token symbol
   * @param address Optional token address
   */
  getTokenIdentifier(symbol: string, address?: string): string {
    // For Ethereum, we prefer the address as the identifier if available
    if (address && this.isValidAddress(address)) {
      return this.normalizeAddress(address);
    }
    
    // Otherwise, use the symbol
    return symbol.toUpperCase();
  }
}