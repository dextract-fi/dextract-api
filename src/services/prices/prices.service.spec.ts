import { Test, TestingModule } from '@nestjs/testing';
import { PricesService } from '@services/prices/prices.service';
import { DataStoreService } from '@datastore/datastore.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { TokenPrice, PriceResponse } from '@exchange/types/price.types';

describe('PricesService', () => {
  let service: PricesService;
  let dataStoreService: jest.Mocked<DataStoreService>;

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

  const mockPriceResponse: PriceResponse = {
    prices: {
      [mockTokenPrice.address.toLowerCase()]: mockTokenPrice,
    },
    updatedAt: Date.now(),
  };

  const mockSolanaPriceResponse: PriceResponse = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        {
          provide: DataStoreService,
          useValue: dataStoreService,
        },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);

    // Mock the private fetchPrices method
    jest.spyOn<any, any>(service, 'fetchPrices')
      .mockImplementation((chainId: ChainId) => {
        if (chainId === ChainId.SOLANA) {
          return Promise.resolve([mockSolanaTokenPrice]);
        }
        return Promise.resolve([mockTokenPrice]);
      });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrices', () => {
    it('should return prices from cache when available', async () => {
      dataStoreService.getOrSet.mockResolvedValue(mockPriceResponse);

      const result = await service.getPrices(ChainId.ETHEREUM);

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        'chain:1:prices',
        expect.any(Function),
        {
          namespace: 'prices',
          ttl: expect.any(Number),
        }
      );
      expect(result).toEqual(mockPriceResponse);
    });

    it('should fetch prices when not in cache', async () => {
      // Simulate a cache miss by having getOrSet execute the factory function
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Also mock the individual token price setting
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.getPrices(ChainId.ETHEREUM);

      expect(dataStoreService.getOrSet).toHaveBeenCalled();
      expect(result.prices[mockTokenPrice.address.toLowerCase()]).toEqual(mockTokenPrice);
      expect(Object.keys(result.prices).length).toBe(1);
    });

    it('should store individual token prices when fetching all prices', async () => {
      // Simulate a cache miss
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      dataStoreService.set.mockResolvedValue(true);

      await service.getPrices(ChainId.ETHEREUM);

      // Should have stored the individual token price
      expect(dataStoreService.set).toHaveBeenCalledWith(
        `chain:1:price:${mockTokenPrice.address.toLowerCase()}`,
        mockTokenPrice,
        expect.any(Object)
      );
    });
  });

  describe('getPrice', () => {
    it('should return a specific token price by address', async () => {
      dataStoreService.getOrSet.mockResolvedValue(mockTokenPrice);

      const result = await service.getPrice(ChainId.ETHEREUM, mockTokenPrice.address);

      expect(result).toEqual(mockTokenPrice);
    });

    it('should normalize Ethereum addresses to lowercase', async () => {
      const uppercaseAddress = mockTokenPrice.address.toUpperCase();
      
      dataStoreService.getOrSet.mockResolvedValue(mockTokenPrice);

      await service.getPrice(ChainId.ETHEREUM, uppercaseAddress);

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        `chain:1:price:${uppercaseAddress.toLowerCase()}`,
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
        return mockPriceResponse;
      });

      const result = await service.getPrice(ChainId.ETHEREUM, mockTokenPrice.address);

      expect(dataStoreService.getOrSet).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTokenPrice);
    });
  });

  describe('refreshPrices', () => {
    it('should fetch prices and update cache', async () => {
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.refreshPrices(ChainId.ETHEREUM);

      // Should have stored all prices
      expect(dataStoreService.set).toHaveBeenCalledWith(
        'chain:1:prices',
        expect.objectContaining({
          prices: expect.any(Object),
          updatedAt: expect.any(Number),
        }),
        expect.any(Object)
      );

      // Should have stored individual price
      expect(dataStoreService.set).toHaveBeenCalledWith(
        `chain:1:price:${mockTokenPrice.address.toLowerCase()}`,
        mockTokenPrice,
        expect.any(Object)
      );

      expect(Object.keys(result.prices).length).toBe(1);
      expect(result.prices[mockTokenPrice.address.toLowerCase()]).toEqual(mockTokenPrice);
    });

    it('should handle different chains correctly', async () => {
      dataStoreService.set.mockResolvedValue(true);

      const result = await service.refreshPrices(ChainId.SOLANA);

      // Check that Solana addresses aren't lowercased
      expect(dataStoreService.set).toHaveBeenCalledWith(
        `chain:101:price:${mockSolanaTokenPrice.address}`,
        mockSolanaTokenPrice,
        expect.any(Object)
      );

      expect(Object.keys(result.prices).length).toBe(1);
      expect(result.prices[mockSolanaTokenPrice.address]).toEqual(mockSolanaTokenPrice);
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