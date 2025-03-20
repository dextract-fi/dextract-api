import { Test, TestingModule } from '@nestjs/testing';
import { SwapsService } from '@services/swaps/swaps.service';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { DataStoreService } from '@datastore/datastore.service';
import { ChainType, NetworkType } from '@common/types/chain.types';
import { SwapQuote, SwapRoute } from '@exchange/types/swap.types';
import { Token } from '@exchange/types/token.types';

describe('SwapsService', () => {
  let service: SwapsService;
  let tokensService: jest.Mocked<TokensService>;
  let pricesService: jest.Mocked<PricesService>;
  let dataStoreService: jest.Mocked<DataStoreService>;

  // Test data with new chain identifiers
  const mockSourceToken: Token = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    symbol: 'SOURCE',
    name: 'Source Token',
    decimals: 18,
    chainType: 'ethereum',
    networkType: 'mainnet',
  };

  const mockDestToken: Token = {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    symbol: 'DEST',
    name: 'Destination Token',
    decimals: 6,
    chainType: 'ethereum',
    networkType: 'mainnet',
  };

  const mockRoute: SwapRoute = {
    fromToken: mockSourceToken.address,
    toToken: mockDestToken.address,
    fromAmount: '1000000000000000000', // 1 SOURCE token in wei
    toAmount: '1000000', // 1 DEST token (with 6 decimals)
    priceImpact: 0.01,
    path: [mockSourceToken.address, mockDestToken.address],
    providers: ['TestDEX'],
    estimatedGas: '150000',
  };

  const mockQuote: SwapQuote = {
    routes: [mockRoute],
    bestRoute: mockRoute,
    fromToken: mockSourceToken.address,
    toToken: mockDestToken.address,
    fromAmount: '1000000000000000000',
    updatedAt: Date.now(),
  };

  beforeEach(async () => {
    // Create mocks for all dependencies
    tokensService = {
      getToken: jest.fn(),
      getTokens: jest.fn(),
    } as unknown as jest.Mocked<TokensService>;

    pricesService = {
      getPrice: jest.fn(),
      getPrices: jest.fn(),
    } as unknown as jest.Mocked<PricesService>;

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
        SwapsService,
        {
          provide: TokensService,
          useValue: tokensService,
        },
        {
          provide: PricesService,
          useValue: pricesService,
        },
        {
          provide: DataStoreService,
          useValue: dataStoreService,
        },
      ],
    }).compile();

    service = module.get<SwapsService>(SwapsService);

    // Mock the private fetchRoutes method
    jest.spyOn<any, any>(service, 'fetchRoutes')
      .mockResolvedValue([mockRoute]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuote', () => {
    it('should return quote from cache when available', async () => {
      dataStoreService.getOrSet.mockResolvedValue(mockQuote);

      const result = await service.getQuote(
        'ethereum',
        'mainnet',
        mockSourceToken.address,
        mockDestToken.address,
        '1000000000000000000',
      );

      expect(dataStoreService.getOrSet).toHaveBeenCalledWith(
        `chain:ethereum:mainnet:quote:${mockSourceToken.address}:${mockDestToken.address}:1000000000000000000`,
        expect.any(Function),
        {
          namespace: 'swaps',
          ttl: expect.any(Number),
        }
      );
      expect(result).toEqual(mockQuote);
    });

    it('should validate tokens exist before fetching routes', async () => {
      // Simulate a cache miss by having getOrSet execute the factory function
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Mock token service to return tokens
      tokensService.getToken
        .mockResolvedValueOnce(mockSourceToken)
        .mockResolvedValueOnce(mockDestToken);

      await service.getQuote(
        'ethereum',
        'mainnet',
        mockSourceToken.address,
        mockDestToken.address,
        '1000000000000000000',
      );

      expect(tokensService.getToken).toHaveBeenCalledWith('ethereum', 'mainnet', mockSourceToken.address);
      expect(tokensService.getToken).toHaveBeenCalledWith('ethereum', 'mainnet', mockDestToken.address);
    });

    it('should throw error when source token is not found', async () => {
      // Simulate a cache miss
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Source token not found
      tokensService.getToken
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDestToken);

      await expect(service.getQuote(
        'ethereum',
        'mainnet',
        '0xnonexistent',
        mockDestToken.address,
        '1000000000000000000',
      )).rejects.toThrow('One or both tokens not found');
    });

    it('should throw error when destination token is not found', async () => {
      // Simulate a cache miss
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Destination token not found
      tokensService.getToken
        .mockResolvedValueOnce(mockSourceToken)
        .mockResolvedValueOnce(null);

      await expect(service.getQuote(
        'ethereum',
        'mainnet',
        mockSourceToken.address,
        '0xnonexistent',
        '1000000000000000000',
      )).rejects.toThrow('One or both tokens not found');
    });

    it('should fetch routes and find the best route', async () => {
      // Simulate a cache miss
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Both tokens found
      tokensService.getToken
        .mockResolvedValueOnce(mockSourceToken)
        .mockResolvedValueOnce(mockDestToken);

      // Create two routes with different toAmounts to test best route selection
      const route1 = { ...mockRoute, toAmount: '1000000' }; // 1.0 DEST
      const route2 = { ...mockRoute, toAmount: '1500000' }; // 1.5 DEST (better)

      // Mock fetchRoutes to return both routes
      jest.spyOn<any, any>(service, 'fetchRoutes')
        .mockResolvedValue([route1, route2]);

      const result = await service.getQuote(
        'ethereum',
        'mainnet',
        mockSourceToken.address,
        mockDestToken.address,
        '1000000000000000000',
      );

      // Best route should be route2 with higher toAmount
      expect(result.bestRoute).toEqual(route2);
      expect(result.routes).toContain(route1);
      expect(result.routes).toContain(route2);
    });

    it('should throw error when no routes are found', async () => {
      // Simulate a cache miss
      dataStoreService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Both tokens found
      tokensService.getToken
        .mockResolvedValueOnce(mockSourceToken)
        .mockResolvedValueOnce(mockDestToken);

      // Mock fetchRoutes to return empty array
      jest.spyOn<any, any>(service, 'fetchRoutes')
        .mockResolvedValue([]);

      await expect(service.getQuote(
        'ethereum',
        'mainnet',
        mockSourceToken.address,
        mockDestToken.address,
        '1000000000000000000',
      )).rejects.toThrow('No routes found');
    });
  });
});