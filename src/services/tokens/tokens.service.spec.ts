import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from '@services/tokens/tokens.service';
import { DataStoreService } from '@datastore/datastore.service';
import { Token, TokenList } from '@exchange/types/token.types';
import { ChainAdapter, ChainIdentifier, ChainType, NetworkType } from '@common/types/chain.types';
import { ApiAdapterFactory, TokenApiAdapter, TokenListResponse, TokenResponse } from '@common/types/api-adapter.types';
import { HttpService } from '@nestjs/axios';
import { ChainAdapterFactory } from '@blockchain/adapters';
import { TokenApiAdapterFactory } from '@api-client/adapters/token';

describe('TokensService', () => {
  let service: TokensService;
  let dataStoreService: jest.Mocked<DataStoreService>;
  let chainAdapterFactory: jest.Mocked<ChainAdapterFactory>;
  let tokenApiAdapterFactory: jest.Mocked<TokenApiAdapterFactory>;
  let mockEthereumAdapter: jest.Mocked<ChainAdapter>;
  let mockSolanaAdapter: jest.Mocked<ChainAdapter>;
  let mockTokenApiAdapter: jest.Mocked<TokenApiAdapter>;

  // Test data
  const mockToken: Token = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    logoURI: 'https://example.com/logo.png',
    tags: ['stablecoin'],
    chainType: 'ethereum',
    networkType: 'mainnet',
  };

  const mockSolanaToken: Token = {
    address: 'SoLToken1111111111111111111111111111111',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://example.com/sol.png',
    chainType: 'solana',
    networkType: 'mainnet',
  };

  const mockTokenList: TokenList = {
    name: 'Test Token List',
    logoURI: 'https://example.com/list-logo.png',
    tokens: [mockToken],
    timestamp: new Date().toISOString(),
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  };

  const mockSolanaTokenList: TokenList = {
    name: 'Solana Token List',
    tokens: [mockSolanaToken],
    timestamp: new Date().toISOString(),
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  };

  const mockTokenResponse: TokenResponse = {
    address: mockToken.address,
    symbol: mockToken.symbol,
    name: mockToken.name,
    decimals: mockToken.decimals,
    logoURI: mockToken.logoURI,
    tags: mockToken.tags,
    chainId: { chain: 'ethereum', network: 'mainnet' },
  };

  const mockSolanaTokenResponse: TokenResponse = {
    address: mockSolanaToken.address,
    symbol: mockSolanaToken.symbol,
    name: mockSolanaToken.name,
    decimals: mockSolanaToken.decimals,
    logoURI: mockSolanaToken.logoURI,
    chainId: { chain: 'solana', network: 'mainnet' },
  };

  const mockTokenListResponse: TokenListResponse = {
    name: mockTokenList.name,
    logoURI: mockTokenList.logoURI,
    tokens: [mockTokenResponse],
    timestamp: mockTokenList.timestamp,
    version: mockTokenList.version,
  };

  const mockSolanaTokenListResponse: TokenListResponse = {
    name: mockSolanaTokenList.name,
    tokens: [mockSolanaTokenResponse],
    timestamp: mockSolanaTokenList.timestamp,
    version: mockSolanaTokenList.version,
  };

  beforeEach(async () => {
    // Create mock for DataStoreService
    dataStoreService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      getOrSet: jest.fn(),
    } as unknown as jest.Mocked<DataStoreService>;

    // Create mock for Ethereum chain adapter
    mockEthereumAdapter = {
      getChainIdentifier: jest.fn().mockReturnValue({ chain: 'ethereum', network: 'mainnet' }),
      getChainConfig: jest.fn(),
      normalizeAddress: jest.fn().mockImplementation((address: string) => address.toLowerCase()),
      isValidAddress: jest.fn().mockReturnValue(true),
      getTokenIdentifier: jest.fn(),
    } as unknown as jest.Mocked<ChainAdapter>;

    // Create mock for Solana chain adapter
    mockSolanaAdapter = {
      getChainIdentifier: jest.fn().mockReturnValue({ chain: 'solana', network: 'mainnet' }),
      getChainConfig: jest.fn(),
      normalizeAddress: jest.fn().mockImplementation((address: string) => address), // Solana doesn't lowercase
      isValidAddress: jest.fn().mockReturnValue(true),
      getTokenIdentifier: jest.fn(),
    } as unknown as jest.Mocked<ChainAdapter>;

    // Create mock for ChainAdapterFactory
    chainAdapterFactory = {
      getAdapter: jest.fn().mockImplementation((chain: ChainType, network: NetworkType) => {
        if (chain === 'ethereum') {
          return mockEthereumAdapter;
        } else if (chain === 'solana') {
          return mockSolanaAdapter;
        }
        throw new Error(`No adapter for ${chain}:${network}`);
      }),
      registerAdapter: jest.fn(),
      getAllAdapters: jest.fn(),
      getSupportedChains: jest.fn().mockReturnValue(['ethereum', 'solana']),
      getSupportedNetworks: jest.fn().mockReturnValue(['mainnet', 'testnet']),
    } as unknown as jest.Mocked<ChainAdapterFactory>;

    // Create mock for TokenApiAdapter
    mockTokenApiAdapter = {
      getConfig: jest.fn(),
      request: jest.fn(),
      getTokenList: jest.fn().mockImplementation((chainId: ChainIdentifier) => {
        if (chainId.chain === 'solana') {
          return Promise.resolve(mockSolanaTokenListResponse);
        }
        return Promise.resolve(mockTokenListResponse);
      }),
      getToken: jest.fn().mockImplementation((chainId: ChainIdentifier, tokenId: string) => {
        if (chainId.chain === 'solana' && tokenId === mockSolanaToken.address) {
          return Promise.resolve(mockSolanaTokenResponse);
        } else if (chainId.chain === 'ethereum' && tokenId.toLowerCase() === mockToken.address.toLowerCase()) {
          return Promise.resolve(mockTokenResponse);
        }
        return Promise.resolve(null);
      }),
    } as unknown as jest.Mocked<TokenApiAdapter>;

    // Create mock for TokenApiAdapterFactory
    tokenApiAdapterFactory = {
      getAdapter: jest.fn().mockReturnValue(mockTokenApiAdapter),
      getDefaultAdapter: jest.fn().mockReturnValue(mockTokenApiAdapter),
      registerAdapter: jest.fn(),
      getAllAdapters: jest.fn().mockReturnValue([mockTokenApiAdapter]),
      getSupportedProviders: jest.fn().mockReturnValue(['coingecko']),
    } as unknown as jest.Mocked<TokenApiAdapterFactory>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: DataStoreService,
          useValue: dataStoreService,
        },
        {
          provide: ChainAdapterFactory,
          useValue: chainAdapterFactory,
        },
        {
          provide: TokenApiAdapterFactory,
          useValue: tokenApiAdapterFactory,
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokens', () => {
    it('should return tokens from cache when available', async () => {
      const cachedTokens = [mockToken];
      dataStoreService.getOrSet.mockResolvedValue(cachedTokens);

      const result = await service.getTokens('ethereum', 'mainnet');

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:tokens',
        expect.any(Function),
        {
          namespace: 'tokens',
          ttl: null,
        }
      );
      expect(result).toEqual(cachedTokens);
    });

    it('should fetch tokens when not in cache', async () => {
      // Simulate a cache miss by having getOrSet execute the factory function
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      const result = await service.getTokens('ethereum', 'mainnet');

      expect(dataStoreService.getOrSet).toHaveBeenCalled();
      expect(tokenApiAdapterFactory.getDefaultAdapter).toHaveBeenCalled();
      expect(mockTokenApiAdapter.getTokenList).toHaveBeenCalledWith({ chain: 'ethereum', network: 'mainnet' });
      expect(result).toHaveLength(1);
      expect(result[0].address).toEqual(mockToken.address);
    });
  });

  describe('getToken', () => {
    it('should return a specific token by address', async () => {
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:ethereum:mainnet:tokens')) {
          return [mockToken];
        }
        return factory();
      });

      const result = await service.getToken('ethereum', 'mainnet', mockToken.address);

      expect(result).toEqual(mockToken);
    });

    it('should normalize Ethereum addresses to lowercase', async () => {
      const uppercaseAddress = mockToken.address.toUpperCase();
      
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:ethereum:mainnet:tokens')) {
          return [mockToken];
        }
        return factory();
      });

      const result = await service.getToken('ethereum', 'mainnet', uppercaseAddress);

      expect(mockEthereumAdapter.normalizeAddress).toHaveBeenCalledWith(uppercaseAddress);
      expect(result).toEqual(mockToken);
    });

    it('should not normalize Solana addresses', async () => {
      const solanaAddress = mockSolanaToken.address;
      
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:solana:mainnet:tokens')) {
          return [mockSolanaToken];
        }
        return factory();
      });

      const result = await service.getToken('solana', 'mainnet', solanaAddress);

      expect(mockSolanaAdapter.normalizeAddress).toHaveBeenCalledWith(solanaAddress);
      expect(result).toEqual(mockSolanaToken);
    });

    it('should return null for non-existent tokens', async () => {
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:ethereum:mainnet:tokens')) {
          return [mockToken];
        }
        return factory();
      });

      mockTokenApiAdapter.getToken.mockResolvedValueOnce(null);

      const result = await service.getToken('ethereum', 'mainnet', '0xnonexistent');

      expect(result).toBeNull();
    });

    it('should fetch token directly from API if not found in cache', async () => {
      // First return empty token list, then return the token from direct API call
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:ethereum:mainnet:tokens')) {
          return []; // Empty token list
        }
        return factory();
      });

      const result = await service.getToken('ethereum', 'mainnet', mockToken.address);

      expect(mockTokenApiAdapter.getToken).toHaveBeenCalledWith(
        { chain: 'ethereum', network: 'mainnet' },
        mockToken.address.toLowerCase()
      );
      expect(result).toEqual(mockToken);
    });
  });

  describe('checkForNewTokens', () => {
    it('should add new tokens to the list', async () => {
      const existingTokens = [mockToken];
      const newToken = {
        ...mockToken,
        address: '0xnewtokenaddress',
        symbol: 'NEW',
        name: 'New Token',
      };
      
      const newTokenResponse = {
        ...mockTokenResponse,
        address: newToken.address,
        symbol: newToken.symbol,
        name: newToken.name,
      };
      
      const updatedTokenListResponse = {
        ...mockTokenListResponse,
        tokens: [mockTokenResponse, newTokenResponse],
      };

      // Mock existing tokens in cache
      dataStoreService.get.mockResolvedValue(existingTokens);
      
      // Mock API returning both existing and new tokens
      mockTokenApiAdapter.getTokenList.mockResolvedValueOnce(updatedTokenListResponse);
      
      // Mock successful cache updates
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.checkForNewTokens('ethereum', 'mainnet');

      // Should have fetched existing tokens
      expect(dataStoreService.get).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:tokens',
        { namespace: 'tokens' }
      );
      
      // Should have fetched token list from API
      expect(mockTokenApiAdapter.getTokenList).toHaveBeenCalledWith(
        { chain: 'ethereum', network: 'mainnet' }
      );
      
      // Should have updated the token list with both tokens
      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:tokens',
        expect.arrayContaining([
          expect.objectContaining({ address: mockToken.address }),
          expect.objectContaining({ address: newToken.address }),
        ]),
        expect.any(Object)
      );
      
      // Should have stored the new token individually
      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:token:0xnewtokenaddress',
        expect.objectContaining({ address: newToken.address }),
        expect.any(Object)
      );
      
      // Should have updated the last sync timestamp
      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:lastSync',
        expect.any(Number),
        expect.any(Object)
      );
      
      // Should return the updated token list
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ address: mockToken.address }),
        expect.objectContaining({ address: newToken.address }),
      ]));
    });

    it('should handle no new tokens scenario', async () => {
      const existingTokens = [mockToken];
      
      // Mock existing tokens in cache
      dataStoreService.get.mockResolvedValue(existingTokens);
      
      // Mock API returning the same tokens
      mockTokenApiAdapter.getTokenList.mockResolvedValueOnce(mockTokenListResponse);
      
      // Mock successful cache updates
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.checkForNewTokens('ethereum', 'mainnet');

      // Should have updated the last sync timestamp
      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:lastSync',
        expect.any(Number),
        expect.any(Object)
      );
      
      // Should return the existing token list
      expect(result).toEqual(existingTokens);
    });

    it('should handle errors during token fetch', async () => {
      const existingTokens = [mockToken];
      
      // Mock existing tokens in cache
      dataStoreService.get.mockResolvedValue(existingTokens);
      
      // Mock API error
      mockTokenApiAdapter.getTokenList.mockRejectedValueOnce(new Error('API error'));

      const result = await service.checkForNewTokens('ethereum', 'mainnet');

      // Should return the existing token list on error
      expect(result).toEqual(existingTokens);
    });
  });

  describe('private methods', () => {
    describe('fetchTokenList', () => {
      it('should fetch token list from API and convert to internal format', async () => {
        // @ts-ignore - Testing private method
        const result = await service['fetchTokenList']({ chain: 'ethereum', network: 'mainnet' });
        
        expect(mockTokenApiAdapter.getTokenList).toHaveBeenCalledWith({ chain: 'ethereum', network: 'mainnet' });
        expect(result.name).toEqual(mockTokenList.name);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].address).toEqual(mockToken.address);
      });

      it('should handle API errors and return empty list', async () => {
        mockTokenApiAdapter.getTokenList.mockRejectedValueOnce(new Error('API error'));
        
        // @ts-ignore - Testing private method
        const result = await service['fetchTokenList']({ chain: 'ethereum', network: 'mainnet' });
        
        expect(result.tokens).toHaveLength(0);
        expect(result.name).toEqual('ethereum:mainnet Tokens');
      });
    });

    describe('convertToToken', () => {
      it('should convert API token response to internal token format', () => {
        // @ts-ignore - Testing private method
        const result = service['convertToToken'](mockTokenResponse);
        
        expect(result).toEqual({
          address: mockToken.address,
          symbol: mockToken.symbol,
          name: mockToken.name,
          decimals: mockToken.decimals,
          logoURI: mockToken.logoURI,
          tags: mockToken.tags,
          chainType: 'ethereum',
          networkType: 'mainnet',
        });
      });
    });

    describe('key generation methods', () => {
      it('should generate correct token list key', () => {
        // @ts-ignore - Testing private method
        const key = service['getTokenListKey']({ chain: 'ethereum', network: 'mainnet' });
        expect(key).toBe('chain:ethereum:mainnet:tokens');
      });

      it('should generate correct token key', () => {
        // @ts-ignore - Testing private method
        const key = service['getTokenKey']({ chain: 'ethereum', network: 'mainnet' }, '0xtoken');
        expect(key).toBe('chain:ethereum:mainnet:token:0xtoken');
      });

      it('should generate correct last sync key', () => {
        // @ts-ignore - Testing private method
        const key = service['getLastSyncKey']({ chain: 'ethereum', network: 'mainnet' });
        expect(key).toBe('chain:ethereum:mainnet:lastSync');
      });
    });
  });
});