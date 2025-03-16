import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from '@services/tokens/tokens.service';
import { DataStoreService } from '@datastore/datastore.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { Token, TokenList } from '@exchange/types/token.types';

describe('TokensService', () => {
  let service: TokensService;
  let dataStoreService: jest.Mocked<DataStoreService>;

  const mockToken: Token = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    chainId: ChainId.ETHEREUM,
    logoURI: 'https://example.com/logo.png',
    tags: ['stablecoin'],
  };

  const mockSolanaToken: Token = {
    address: 'SoLToken1111111111111111111111111111111',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    chainId: ChainId.SOLANA,
    logoURI: 'https://example.com/sol.png',
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: DataStoreService,
          useValue: dataStoreService,
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);

    // Mock the private fetchTokenList method
    jest.spyOn<any, any>(service, 'fetchTokenList')
      .mockImplementation((chainId: ChainId) => {
        if (chainId === ChainId.SOLANA) {
          return Promise.resolve(mockSolanaTokenList);
        }
        return Promise.resolve(mockTokenList);
      });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokens', () => {
    it('should return tokens from cache when available', async () => {
      const cachedTokens = [mockToken];
      dataStoreService.getOrSet.mockResolvedValue(cachedTokens);

      const result = await service.getTokens(ChainId.ETHEREUM);

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        'chain:1:tokens',
        expect.any(Function),
        {
          namespace: 'tokens',
          ttl: expect.any(Number),
        }
      );
      expect(result).toEqual(cachedTokens);
    });

    it('should fetch tokens when not in cache', async () => {
      // Simulate a cache miss by having getOrSet execute the factory function
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      const result = await service.getTokens(ChainId.ETHEREUM);

      expect(dataStoreService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(mockTokenList.tokens);
    });
  });

  describe('getToken', () => {
    it('should return a specific token by address', async () => {
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:1:tokens')) {
          return [mockToken];
        }
        return factory();
      });

      const result = await service.getToken(ChainId.ETHEREUM, mockToken.address);

      expect(result).toEqual(mockToken);
    });

    it('should normalize Ethereum addresses to lowercase', async () => {
      const uppercaseAddress = mockToken.address.toUpperCase();
      
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:1:tokens')) {
          return [mockToken];
        }
        return factory();
      });

      const result = await service.getToken(ChainId.ETHEREUM, uppercaseAddress);

      expect(result).toEqual(mockToken);
    });

    it('should not normalize Solana addresses', async () => {
      const solanaAddress = mockSolanaToken.address;
      
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:101:tokens')) {
          return [mockSolanaToken];
        }
        return factory();
      });

      const result = await service.getToken(ChainId.SOLANA, solanaAddress);

      expect(result).toEqual(mockSolanaToken);
    });

    it('should return null for non-existent tokens', async () => {
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        if (key.includes('chain:1:tokens')) {
          return [mockToken];
        }
        return factory();
      });

      const result = await service.getToken(ChainId.ETHEREUM, '0xnonexistent');

      expect(result).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should fetch tokens and update cache', async () => {
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.refreshTokens(ChainId.ETHEREUM);

      // Should store all tokens
      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:1:tokens',
        mockTokenList.tokens,
        expect.any(Object)
      );

      // Should store individual token
      expect(dataStoreService.set).toHaveBeenCalledWith(
        `chain:1:token:${mockToken.address.toLowerCase()}`,
        mockToken,
        expect.any(Object)
      );

      expect(result).toEqual(mockTokenList.tokens);
    });

    it('should handle different chains correctly', async () => {
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.refreshTokens(ChainId.SOLANA);

      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:101:tokens',
        mockSolanaTokenList.tokens,
        expect.any(Object)
      );

      expect(dataStoreService.set).toHaveBeenCalledWith(
        `chain:101:token:${mockSolanaToken.address}`,
        mockSolanaToken,
        expect.any(Object)
      );

      expect(result).toEqual(mockSolanaTokenList.tokens);
    });
  });

  describe('normalizeAddress', () => {
    it('should convert Ethereum addresses to lowercase', () => {
      const upperCaseAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      
      // @ts-ignore - Testing private method
      const normalized = service['normalizeAddress'](upperCaseAddress, ChainId.ETHEREUM);
      
      expect(normalized).toBe(upperCaseAddress.toLowerCase());
    });

    it('should not modify Solana addresses', () => {
      const solanaAddress = 'SoLToken1111111111111111111111111111111';
      
      // @ts-ignore - Testing private method
      const normalized = service['normalizeAddress'](solanaAddress, ChainId.SOLANA);
      
      expect(normalized).toBe(solanaAddress);
    });
  });
});