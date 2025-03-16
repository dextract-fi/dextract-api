import { Injectable, Logger } from '@nestjs/common';
import { Token, TokenList } from '@common/types/token.types';
import { ChainId } from '@common/constants/chains.constants';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private tokensByChain: Map<ChainId, Map<string, Token>> = new Map();
  private tokenListsByChain: Map<ChainId, TokenList> = new Map();

  constructor() {
    // Initialize token maps
    Object.values(ChainId).forEach(chainId => {
      if (typeof chainId === 'number') {
        this.tokensByChain.set(chainId, new Map());
      }
    });
  }

  async getTokens(chainId: ChainId): Promise<Token[]> {
    const tokens = this.tokensByChain.get(chainId);
    if (!tokens || tokens.size === 0) {
      await this.loadTokensForChain(chainId);
    }
    return Array.from(this.tokensByChain.get(chainId)?.values() || []);
  }

  async getToken(chainId: ChainId, address: string): Promise<Token | null> {
    const normalizedAddress = this.normalizeAddress(address, chainId);
    const tokens = this.tokensByChain.get(chainId);
    
    if (!tokens || !tokens.has(normalizedAddress)) {
      await this.loadTokensForChain(chainId);
    }
    
    return this.tokensByChain.get(chainId)?.get(normalizedAddress) || null;
  }

  async loadTokensForChain(chainId: ChainId): Promise<void> {
    try {
      // This is a placeholder - in the real implementation, 
      // we would fetch from an external source or KV store
      const tokenList = await this.fetchTokenList(chainId);
      
      const tokenMap = new Map<string, Token>();
      tokenList.tokens.forEach(token => {
        const normalizedAddress = this.normalizeAddress(token.address, chainId);
        tokenMap.set(normalizedAddress, token);
      });
      
      this.tokensByChain.set(chainId, tokenMap);
      this.tokenListsByChain.set(chainId, tokenList);
      
      this.logger.log(`Loaded ${tokenMap.size} tokens for chain ${chainId}`);
    } catch (error) {
      this.logger.error(`Failed to load tokens for chain ${chainId}: ${error.message}`);
      throw error;
    }
  }

  private async fetchTokenList(chainId: ChainId): Promise<TokenList> {
    // Placeholder - implement actual fetching logic
    // This could be from KV store, external API, etc.
    return {
      name: `Chain ${chainId} Tokens`,
      tokens: [],
      timestamp: new Date().toISOString(),
      version: { major: 1, minor: 0, patch: 0 },
    };
  }

  private normalizeAddress(address: string, chainId: ChainId): string {
    // Normalize address based on chain
    // For Ethereum, convert to lowercase
    // For Solana, leave as is (case-sensitive)
    if (chainId === ChainId.ETHEREUM) {
      return address.toLowerCase();
    }
    return address;
  }
}
