import { Injectable, Logger } from '@nestjs/common';
import { Token, TokenList } from '@exchange/types/token.types';
import { DataStoreService } from '@datastore/datastore.service';
import { ChainAdapter, ChainIdentifier, ChainType, NetworkType } from '@common/types/chain.types';
import { ChainAdapterFactory } from '@blockchain/adapters';
import { TokenApiAdapter, TokenResponse } from '@common/types/api-adapter.types';
import { TokenApiAdapterFactory } from '@api-client/adapters/token';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly NAMESPACE = 'tokens';
  private readonly TOKEN_LIST_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly chainAdapterFactory: ChainAdapterFactory,
    private readonly tokenApiAdapterFactory: TokenApiAdapterFactory,
  ) {}

  /**
   * Get all tokens for a specific chain and network
   * @param chain The chain type
   * @param network The network type
   */
  async getTokens(chain: ChainType, network: NetworkType): Promise<Token[]> {
    const chainId = this.getChainIdentifier(chain, network);
    const key = this.getTokenListKey(chainId);
    
    return this.dataStoreService.getOrSet<Token[]>(
      key,
      async () => {
        const tokenList = await this.fetchTokenList(chainId);
        return tokenList.tokens;
      },
      { namespace: this.NAMESPACE, ttl: null } // No TTL, tokens are stored indefinitely
    );
  }

  /**
   * Get a specific token by address or symbol
   * @param chain The chain type
   * @param network The network type
   * @param tokenId The token identifier (address or symbol)
   */
  async getToken(chain: ChainType, network: NetworkType, tokenId: string): Promise<Token | null> {
    const chainId = this.getChainIdentifier(chain, network);
    const chainAdapter = this.getChainAdapter(chainId);
    const normalizedTokenId = chainAdapter.normalizeAddress(tokenId);
    const key = this.getTokenKey(chainId, normalizedTokenId);
    
    return this.dataStoreService.getOrSet<Token | null>(
      key,
      async () => {
        // First try to find in the cached token list
        const tokens = await this.getTokens(chain, network);
        const token = tokens.find(t =>
          chainAdapter.normalizeAddress(t.address) === normalizedTokenId ||
          t.symbol.toUpperCase() === tokenId.toUpperCase()
        );
        
        if (token) {
          return token;
        }
        
        // If not found in the list, try to fetch directly
        const tokenAdapter = this.tokenApiAdapterFactory.getDefaultAdapter();
        const tokenResponse = await tokenAdapter.getToken(chainId, tokenId);
        
        if (tokenResponse) {
          // Convert to our token format
          const newToken = this.convertToToken(tokenResponse);
          
          // Cache the token
          await this.dataStoreService.set(
            key,
            newToken,
            { namespace: this.NAMESPACE, ttl: null } // No TTL, tokens are stored indefinitely
          );
          
          return newToken;
        }
        
        return null;
      },
      { namespace: this.NAMESPACE, ttl: null } // No TTL, tokens are stored indefinitely
    );
  }

  /**
   * Check for new tokens and update the token list
   * @param chain The chain type
   * @param network The network type
   */
  async checkForNewTokens(chain: ChainType, network: NetworkType): Promise<Token[]> {
    const chainId = this.getChainIdentifier(chain, network);
    const key = this.getTokenListKey(chainId);
    
    // Get current token list
    const currentTokens = await this.dataStoreService.get<Token[]>(key, { namespace: this.NAMESPACE }) || [];
    
    // Fetch latest token list
    const tokenList = await this.fetchTokenList(chainId);
    const newTokens = tokenList.tokens;
    
    // Find tokens that don't exist in the current list
    const chainAdapter = this.getChainAdapter(chainId);
    const currentAddresses = new Set(currentTokens.map(t => chainAdapter.normalizeAddress(t.address)));
    
    const tokensToAdd = newTokens.filter(token =>
      !currentAddresses.has(chainAdapter.normalizeAddress(token.address))
    );
    
    if (tokensToAdd.length > 0) {
      this.logger.log(`Found ${tokensToAdd.length} new tokens for ${chain}:${network}`);
      
      // Add new tokens to the list
      const updatedTokens = [...currentTokens, ...tokensToAdd];
      
      // Store the updated token list
      await this.dataStoreService.set(
        key,
        updatedTokens,
        { namespace: this.NAMESPACE, ttl: null } // No TTL, tokens are stored indefinitely
      );
      
      // Store individual tokens
      await Promise.all(tokensToAdd.map(async (token) => {
        const normalizedAddress = chainAdapter.normalizeAddress(token.address);
        const tokenKey = this.getTokenKey(chainId, normalizedAddress);
        
        await this.dataStoreService.set(
          tokenKey,
          token,
          { namespace: this.NAMESPACE, ttl: null } // No TTL, tokens are stored indefinitely
        );
      }));
      
      // Update last sync timestamp
      await this.dataStoreService.set(
        this.getLastSyncKey(chainId),
        Date.now(),
        { namespace: this.NAMESPACE, ttl: null }
      );
      
      return updatedTokens;
    } else {
      this.logger.log(`No new tokens found for ${chain}:${network}`);
      
      // Update last sync timestamp
      await this.dataStoreService.set(
        this.getLastSyncKey(chainId),
        Date.now(),
        { namespace: this.NAMESPACE, ttl: null }
      );
      
      return currentTokens;
    }
  }

  /**
   * Fetch token list from external API
   * @param chainId The chain identifier
   */
  private async fetchTokenList(chainId: ChainIdentifier): Promise<TokenList> {
    const tokenAdapter = this.tokenApiAdapterFactory.getDefaultAdapter();
    const tokenListResponse = await tokenAdapter.getTokenList(chainId);
    
    // Convert to our token format
    const tokens = tokenListResponse.tokens.map(this.convertToToken);
    
    return {
      name: tokenListResponse.name,
      logoURI: tokenListResponse.logoURI,
      tokens,
      timestamp: tokenListResponse.timestamp,
      version: tokenListResponse.version,
    };
  }

  /**
   * Convert token response to our token format
   * @param tokenResponse The token response from API
   */
  private convertToToken(tokenResponse: TokenResponse): Token {
    return {
      address: tokenResponse.address,
      symbol: tokenResponse.symbol,
      name: tokenResponse.name,
      decimals: tokenResponse.decimals,
      logoURI: tokenResponse.logoURI,
      tags: tokenResponse.tags,
      chainType: tokenResponse.chainId.chain,
      networkType: tokenResponse.chainId.network,
    };
  }

  /**
   * Get chain identifier from chain type and network
   * @param chain The chain type
   * @param network The network type
   */
  private getChainIdentifier(chain: ChainType, network: NetworkType): ChainIdentifier {
    return { chain, network };
  }

  /**
   * Get chain adapter for a chain identifier
   * @param chainId The chain identifier
   */
  private getChainAdapter(chainId: ChainIdentifier): ChainAdapter {
    return this.chainAdapterFactory.getAdapter(chainId.chain, chainId.network);
  }

  /**
   * Get token list key for a chain identifier
   * @param chainId The chain identifier
   */
  private getTokenListKey(chainId: ChainIdentifier): string {
    return `chain:${chainId.chain}:${chainId.network}:tokens`;
  }

  /**
   * Get token key for a chain identifier and token address
   * @param chainId The chain identifier
   * @param tokenId The token identifier
   */
  private getTokenKey(chainId: ChainIdentifier, tokenId: string): string {
    return `chain:${chainId.chain}:${chainId.network}:token:${tokenId}`;
  }

  /**
   * Get last sync key for a chain identifier
   * @param chainId The chain identifier
   */
  private getLastSyncKey(chainId: ChainIdentifier): string {
    return `chain:${chainId.chain}:${chainId.network}:lastSync`;
  }
}