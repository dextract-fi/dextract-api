import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from '@workers/cron/cron.service';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { Token } from '@exchange/types/token.types';
import { PriceResponse } from '@exchange/types/price.types';

describe('CronService', () => {
  let service: CronService;
  let tokensService: jest.Mocked<TokensService>;
  let pricesService: jest.Mocked<PricesService>;

  // Mock chain IDs to test with
  const testChainIds = [ChainId.ETHEREUM, ChainId.SOLANA];

  beforeEach(async () => {
    // Create mocks
    tokensService = {
      refreshTokens: jest.fn(),
    } as unknown as jest.Mocked<TokensService>;

    pricesService = {
      refreshPrices: jest.fn(),
    } as unknown as jest.Mocked<PricesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        {
          provide: TokensService,
          useValue: tokensService,
        },
        {
          provide: PricesService,
          useValue: pricesService,
        },
      ],
    }).compile();

    service = module.get<CronService>(CronService);

    // Mock console.error to prevent test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('refreshTokens', () => {
    it('should refresh tokens for all chains', async () => {
      // Mock successful token refresh
      const mockTokens: Token[] = [
        {
          address: '0x1234',
          symbol: 'TEST',
          name: 'Test Token',
          decimals: 18,
          chainId: ChainId.ETHEREUM,
        },
      ];
      
      tokensService.refreshTokens.mockResolvedValue(mockTokens);

      await service.refreshTokens();

      // Should have called refreshTokens for each chain
      expect(tokensService.refreshTokens).toHaveBeenCalledTimes(testChainIds.length);
      
      // Verify it was called with each chain ID
      testChainIds.forEach(chainId => {
        expect(tokensService.refreshTokens).toHaveBeenCalledWith(chainId);
      });
    });

    it('should handle errors during token refresh', async () => {
      // Mock an error for one chain
      tokensService.refreshTokens
        .mockResolvedValueOnce([]) // First chain succeeds
        .mockRejectedValueOnce(new Error('Token fetch failed')); // Second chain fails

      // Create a spy on the logger
      const loggerErrorSpy = jest.spyOn<any, any>(service['logger'], 'error');

      await service.refreshTokens();

      // Should still have called refreshTokens for each chain
      expect(tokensService.refreshTokens).toHaveBeenCalledTimes(testChainIds.length);
      
      // Should have logged the error
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error refreshing tokens')
      );
    });
  });

  describe('refreshPrices', () => {
    it('should refresh prices for all chains', async () => {
      // Mock successful price refresh
      const mockPriceResponse: PriceResponse = {
        prices: {
          '0x1234': {
            address: '0x1234',
            priceUsd: 1.23,
            timestamp: Date.now(),
          },
        },
        updatedAt: Date.now(),
      };
      
      pricesService.refreshPrices.mockResolvedValue(mockPriceResponse);

      await service.refreshPrices();

      // Should have called refreshPrices for each chain
      expect(pricesService.refreshPrices).toHaveBeenCalledTimes(testChainIds.length);
      
      // Verify it was called with each chain ID
      testChainIds.forEach(chainId => {
        expect(pricesService.refreshPrices).toHaveBeenCalledWith(chainId);
      });
    });

    it('should handle errors during price refresh', async () => {
      // Mock an error for one chain
      pricesService.refreshPrices
        .mockResolvedValueOnce({ prices: {}, updatedAt: Date.now() }) // First chain succeeds
        .mockRejectedValueOnce(new Error('Price fetch failed')); // Second chain fails

      // Create a spy on the logger
      const loggerErrorSpy = jest.spyOn<any, any>(service['logger'], 'error');

      await service.refreshPrices();

      // Should still have called refreshPrices for each chain
      expect(pricesService.refreshPrices).toHaveBeenCalledTimes(testChainIds.length);
      
      // Should have logged the error
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error refreshing prices')
      );
    });
  });
});