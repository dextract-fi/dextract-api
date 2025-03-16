import { Injectable, Logger } from '@nestjs/common';
import { Token, TokenList } from '@exchange/types/token.types';
import { ChainId } from '@exchange/constants/chains.constants';
import { DataStoreService } from '@datastore/datastore.service';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly NAMESPACE = 'tokens';
  private readonly TOKEN_LIST_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly dataStoreService: DataStoreService) {}

  async getTokens(chainId: ChainId): Promise<Token[]> {
    const key = `chain:${chainId}:tokens`;
    
    return this.dataStoreService.getOrSet<Token[]>(
      key,
      async () => {
        const tokenList = await this.fetchTokenList(chainId);
        return tokenList.tokens;
      },
      { namespace: this.NAMESPACE, ttl: this.TOKEN_LIST_TTL }
    );
  }

  async getToken(chainId: ChainId, address: string): Promise<Token | null> {
    const normalizedAddress = this.normalizeAddress(address, chainId);
    const key = `chain:${chainId}:token:${normalizedAddress}`;
    
    return this.dataStoreService.getOrSet<Token | null>(
      key,
      async () => {
        const tokens = await this.getTokens(chainId);
        return tokens.find(token => 
          this.normalizeAddress(token.address, chainId) === normalizedAddress
        ) || null;
      },
      { namespace: this.NAMESPACE, ttl: this.TOKEN_LIST_TTL }
    );
  }

  async refreshTokens(chainId: ChainId): Promise<Token[]> {
    const tokenList = await this.fetchTokenList(chainId);
    const tokens = tokenList.tokens;
    
    // Store the token list
    const listKey = `chain:${chainId}:tokens`;
    await this.dataStoreService.set(
      listKey, 
      tokens, 
      { namespace: this.NAMESPACE, ttl: this.TOKEN_LIST_TTL }
    );
    
    // Store individual tokens
    await Promise.all(tokens.map(async (token) => {
      const normalizedAddress = this.normalizeAddress(token.address, chainId);
      const tokenKey = `chain:${chainId}:token:${normalizedAddress}`;
      
      await this.dataStoreService.set(
        tokenKey,
        token,
        { namespace: this.NAMESPACE, ttl: this.TOKEN_LIST_TTL }
      );
    }));
    
    return tokens;
  }

  private async fetchTokenList(chainId: ChainId): Promise<TokenList> {
    // Placeholder - implement actual fetching logic
    // This could be from external API, etc.
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