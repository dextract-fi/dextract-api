import { Test, TestingModule } from '@nestjs/testing';
import { PricesService } from '@services/prices/prices.service';
import { DataStoreService } from '@datastore/datastore.service';
import { TokenPrice, PriceResponse as ExchangePriceResponse } from '@exchange/types/price.types';
import { ChainAdapter, ChainIdentifier, ChainType, NetworkType } from '@common/types/chain.types';
import { ApiAdapterFactory, PriceApiAdapter, PriceResponse, PriceListResponse } from '@common/types/api-adapter.types';
import { HttpService } from '@nestjs/axios';
import { ChainAdapterFactory } from '@blockchain/adapters';
import { PriceApiAdapterFactory } from '@api-client/adapters/price';

describe('PricesService', () => {
  let service: PricesService;
  let dataStoreService: jest.Mocked<DataStoreService>;
  let chainAdapterFactory: jest.Mocked<ChainAdapterFactory>;
  let priceApiAdapterFactory: jest.Mocked<PriceApiAdapterFactory>;
  let mockEthereumAdapter: jest.Mocked<ChainAdapter>;
  let mockSolanaAdapter: jest.Mocked<ChainAdapter>;
  let mockPriceApiAdapter: jest.Mocked<PriceApiAdapter>;

  // Test data
  const mockTokenPrice: TokenPrice = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    priceUsd: 1.23,
    timestamp: Date.now(),
    change24h: 0.05,
    change7d: 0.10,
    volume24h: 1000000,
    marketCap: 100000000,
  };

  const mockSolanaTokenPrice: TokenPrice = {
    address: 'SoLToken1111111111111111111111111111111',
    priceUsd: 150.25,
    timestamp: Date.now(),
    change24h: 0.03,
    change7d: -0.05,
    volume24h: 5000000,
    marketCap: 750000000,
  };

  const mockPriceApiResponse: PriceResponse = {
    address: mockTokenPrice.address,
    priceUsd: mockTokenPrice.priceUsd,
    timestamp: mockTokenPrice.timestamp,
    change24h: mockTokenPrice.change24h,
    change7d: mockTokenPrice.change7d,
    volume24h: mockTokenPrice.volume24h,
    marketCap: mockTokenPrice.marketCap,
  };

  const mockSolanaPriceApiResponse: PriceResponse = {
    address: mockSolanaTokenPrice.address,
    priceUsd: mockSolanaTokenPrice.priceUsd,
    timestamp: mockSolanaTokenPrice.timestamp,
    change24h: mockSolanaTokenPrice.change24h,
    change7d: mockSolanaTokenPrice.change7d,
    volume24h: mockSolanaTokenPrice.volume24h,
    marketCap: mockSolanaTokenPrice.marketCap,
  };

  const mockPriceListResponse: PriceListResponse = {
    prices: {
      [mockTokenPrice.address.toLowerCase()]: mockPriceApiResponse,
    },
    updatedAt: Date.now(),
  };

  const mockSolanaPriceListResponse: PriceListResponse = {
    prices: {
      [mockSolanaTokenPrice.address]: mockSolanaPriceApiResponse,
    },
    updatedAt: Date.now(),
  };

  const mockExchangePriceResponse: ExchangePriceResponse = {
    prices: {
      [mockTokenPrice.address.toLowerCase()]: mockTokenPrice,
    },
    updatedAt: Date.now(),
  };

  const mockSolanaExchangePriceResponse: ExchangePriceResponse = {
    prices: {
      [mockSolanaTokenPrice.address]: mockSolanaTokenPrice,
    },
    updatedAt: Date.now(),
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

    // Create mock for PriceApiAdapter
    mockPriceApiAdapter = {
      getConfig: jest.fn(),
      request: jest.fn(),
      getPrices: jest.fn().mockImplementation((chainId: ChainIdentifier) => {
        if (chainId.chain === 'solana') {
          return Promise.resolve(mockSolanaPriceListResponse);
        }
        return Promise.resolve(mockPriceListResponse);
      }),
      getPrice: jest.fn().mockImplementation((chainId: ChainIdentifier, tokenId: string) => {
        if (chainId.chain === 'solana' && tokenId === mockSolanaTokenPrice.address) {
          return Promise.resolve(mockSolanaPriceApiResponse);
        } else if (chainId.chain === 'ethereum' && tokenId.toLowerCase() === mockTokenPrice.address.toLowerCase()) {
          return Promise.resolve(mockPriceApiResponse);
        }
        return Promise.resolve(null);
      }),
    } as unknown as jest.Mocked<PriceApiAdapter>;

    // Create mock for PriceApiAdapterFactory
    priceApiAdapterFactory = {
      getAdapter: jest.fn().mockReturnValue(mockPriceApiAdapter),
      getDefaultAdapter: jest.fn().mockReturnValue(mockPriceApiAdapter),
      registerAdapter: jest.fn(),
      getAllAdapters: jest.fn().mockReturnValue([mockPriceApiAdapter]),
      getSupportedProviders: jest.fn().mockReturnValue(['coingecko']),
    } as unknown as jest.Mocked<PriceApiAdapterFactory>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        {
          provide: DataStoreService,
          useValue: dataStoreService,
        },
        {
          provide: ChainAdapterFactory,
          useValue: chainAdapterFactory,
        },
        {
          provide: PriceApiAdapterFactory,
          useValue: priceApiAdapterFactory,
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrices', () => {
    it('should return prices from cache when available', async () => {
      dataStoreService.getOrSet.mockResolvedValue(mockExchangePriceResponse);

      const result = await service.getPrices('ethereum', 'mainnet');

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        'chain:ethereum:mainnet:prices',
        expect.any(Function),
        {
          namespace: 'prices',
          ttl: expect.any(Number),
        }
      );
      expect(result).toEqual(mockExchangePriceResponse);
    });

    it('should fetch prices when not in cache', async () => {
      // Simulate a cache miss by having getOrSet execute the factory function
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Also mock the individual token price setting
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.getPrices('ethereum', 'mainnet');

      expect(dataStoreService.getOrSet).toHaveBeenCalled();
      expect(mockPriceApiAdapter.getPrices).toHaveBeenCalledWith({ chain: 'ethereum', network: 'mainnet' });
      expect(result.prices).toBeDefined();
      expect(Object.keys(result.prices).length).toBe(1);
    });

    it('should store individual token prices when fetching all prices', async () => {
      // Simulate a cache miss
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      dataStoreService.set.mockResolvedValue(true);

      await service.getPrices('ethereum', 'mainnet');

      // Should have stored the individual token price
      expect(dataStoreService.set).toHaveBeenCalledWith(
        expect.stringContaining('price:'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('getPrice', () => {
    it('should return a specific token price by address', async () => {
      dataStoreService.getOrSet.mockResolvedValue(mockTokenPrice);

      const result = await service.getPrice('ethereum', 'mainnet', mockTokenPrice.address);

      expect(result).toEqual(mockTokenPrice);
    });

    it('should normalize Ethereum addresses to lowercase', async () => {
      const uppercaseAddress = mockTokenPrice.address.toUpperCase();
      
      dataStoreService.getOrSet.mockResolvedValue(mockTokenPrice);

      await service.getPrice('ethereum', 'mainnet', uppercaseAddress);

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining(uppercaseAddress.toLowerCase()),
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should handle cache misses by looking in all prices', async () => {
      // First call for individual price returns null, second call for all prices returns the prices
      dataStoreService.getOrSet.mockImplementationOnce(async (key, factory) => {
        // First call - individual price not found
        return factory();
      }).mockImplementationOnce(async (key, factory) => {
        // Second call - return all prices including the one we want
        return mockExchangePriceResponse;
      });

      const result = await service.getPrice('ethereum', 'mainnet', mockTokenPrice.address);

      expect(dataStoreService.getOrSet).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTokenPrice);
    });
  });

  describe('refreshPrices', () => {
    it('should fetch prices and update cache', async () => {
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.refreshPrices('ethereum', 'mainnet');

      // Should have stored all prices
      expect(dataStoreService.set).toHaveBeenCalledWith(
        expect.stringContaining('prices'),
        expect.objectContaining({
          prices: expect.any(Object),
          updatedAt: expect.any(Number),
        }),
        expect.any(Object)
      );

      // Should have stored individual price
      expect(dataStoreService.set).toHaveBeenCalledWith(
        expect.stringContaining('price:'),
        expect.any(Object),
        expect.any(Object)
      );

      expect(Object.keys(result.prices).length).toBe(1);
    });

    it('should handle different chains correctly', async () => {
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.refreshPrices('solana', 'mainnet');

      // Check that Solana addresses aren't lowercased
      expect(mockSolanaAdapter.normalizeAddress).toHaveBeenCalled();
      expect(dataStoreService.set).toHaveBeenCalled();

      expect(Object.keys(result.prices).length).toBe(1);
    });
  });

  describe('getChainAdapter', () => {
    it('should get the correct adapter for Ethereum', () => {
      // @ts-ignore - Testing private method
      const adapter = service['getChainAdapter']({ chain: 'ethereum', network: 'mainnet' });
      
      expect(chainAdapterFactory.getAdapter).toHaveBeenCalledWith('ethereum', 'mainnet');
      expect(adapter).toBe(mockEthereumAdapter);
    });

    it('should get the correct adapter for Solana', () => {
      // @ts-ignore - Testing private method
      const adapter = service['getChainAdapter']({ chain: 'solana', network: 'mainnet' });
      
      expect(chainAdapterFactory.getAdapter).toHaveBeenCalledWith('solana', 'mainnet');
      expect(adapter).toBe(mockSolanaAdapter);
    });
  });
});