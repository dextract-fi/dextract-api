import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from '@workers/cron/cron.service';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { ChainType, NetworkType } from '@common/types/chain.types';
import { Token } from '@exchange/types/token.types';
import { PriceResponse as ExchangePriceResponse } from '@exchange/types/price.types';
import { ChainAdapterFactory } from '@blockchain/adapters/base-chain.adapter';

describe('CronService', () => {
  let service: CronService;
  let tokensService: jest.Mocked<TokensService>;
  let pricesService: jest.Mocked<PricesService>;
  let chainAdapterFactory: jest.Mocked<ChainAdapterFactory>;

  // Test chains and networks
  const testChains: ChainType[] = ['ethereum', 'solana'];
  const testNetworks: NetworkType[] = ['mainnet'];

  beforeEach(async () => {
    // Create mocks
    tokensService = {
      checkForNewTokens: jest.fn(),
    } as unknown as jest.Mocked<TokensService>;

    pricesService = {
      refreshPrices: jest.fn(),
    } as unknown as jest.Mocked<PricesService>;

    chainAdapterFactory = {
      getSupportedChains: jest.fn().mockReturnValue(testChains),
      getSupportedNetworks: jest.fn().mockReturnValue(testNetworks),
    } as unknown as jest.Mocked<ChainAdapterFactory>;

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
        {
          provide: ChainAdapterFactory,
          useValue: chainAdapterFactory,
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

  describe('checkForNewTokens', () => {
    it('should check for new tokens for all chains and networks', async () => {
      // Mock successful token check
      const mockTokens: Token[] = [
        {
          address: '0x1234',
          symbol: 'TEST',
          name: 'Test Token',
          decimals: 18,
          chainType: 'ethereum',
          networkType: 'mainnet',
        },
      ];
      
      tokensService.checkForNewTokens.mockResolvedValue(mockTokens);

      await service.checkForNewTokens();

      // Should have called checkForNewTokens for each chain and network combination
      // But only for mainnet networks
      const expectedCalls = testChains.length * testNetworks.length;
      expect(tokensService.checkForNewTokens).toHaveBeenCalledTimes(expectedCalls);
      
      // Verify it was called with each chain and network
      testChains.forEach(chain => {
        testNetworks.forEach(network => {
          if (network === 'mainnet') {
            expect(tokensService.checkForNewTokens).toHaveBeenCalledWith(chain, network);
          }
        });
      });
    });

    it('should handle errors during token check', async () => {
      // Mock an error for one chain
      tokensService.checkForNewTokens
        .mockResolvedValueOnce([]) // First chain succeeds
        .mockRejectedValueOnce(new Error('Token fetch failed')); // Second chain fails

      // Create a spy on the logger
      const loggerErrorSpy = jest.spyOn<any, any>(service['logger'], 'error');

      await service.checkForNewTokens();

      // Should have logged the error
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error checking for new tokens')
      );
    });
  });

  describe('refreshPrices', () => {
    it('should refresh prices for all chains and networks', async () => {
      // Mock successful price refresh
      const mockExchangePriceResponse: ExchangePriceResponse = {
        prices: {
          '0x1234': {
            address: '0x1234',
            priceUsd: 1.23,
            timestamp: Date.now(),
            change24h: 0.05,
            change7d: 0.1,
            volume24h: 1000000,
            marketCap: 10000000,
          },
        },
        updatedAt: Date.now(),
      };
      
      pricesService.refreshPrices.mockResolvedValue(mockExchangePriceResponse);

      await service.refreshPrices();

      // Should have called refreshPrices for each chain and network combination
      // But only for mainnet networks
      const expectedCalls = testChains.length * testNetworks.length;
      expect(pricesService.refreshPrices).toHaveBeenCalledTimes(expectedCalls);
      
      // Verify it was called with each chain and network
      testChains.forEach(chain => {
        testNetworks.forEach(network => {
          if (network === 'mainnet') {
            expect(pricesService.refreshPrices).toHaveBeenCalledWith(chain, network);
          }
        });
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

      // Should have logged the error
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error refreshing prices')
      );
    });
  });

  describe('getSupportedChainNetworks', () => {
    it('should return all supported chain-network pairs', () => {
      // @ts-ignore - Testing private method
      const result = service['getSupportedChainNetworks']();
      
      // Should have called getSupportedChains
      expect(chainAdapterFactory.getSupportedChains).toHaveBeenCalled();
      
      // Should have called getSupportedNetworks for each chain
      testChains.forEach(chain => {
        expect(chainAdapterFactory.getSupportedNetworks).toHaveBeenCalledWith(chain);
      });
      
      // Should return the correct number of pairs
      const expectedPairs = testChains.length * testNetworks.length;
      expect(result.length).toBe(expectedPairs);
      
      // Should include all combinations
      testChains.forEach(chain => {
        testNetworks.forEach(network => {
          expect(result).toContainEqual({ chain, network });
        });
      });
    });
  });
});