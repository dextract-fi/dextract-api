import { Test, TestingModule } from '@nestjs/testing';
import { PricesController } from '@api/controllers/prices.controller';
import { PricesService } from '@services/prices/prices.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { TokenPrice, PriceResponse } from '@exchange/types/price.types';

describe('PricesController', () => {
  let controller: PricesController;
  let pricesService: jest.Mocked<PricesService>;

  const mockTokenPrice: TokenPrice = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    priceUsd: 1.23,
    timestamp: Date.now(),
    change24h: 0.05,
    change7d: 0.10,
    volume24h: 1000000,
    marketCap: 100000000,
  };

  const mockPriceResponse: PriceResponse = {
    prices: {
      [mockTokenPrice.address.toLowerCase()]: mockTokenPrice,
      '0xabcdef1234567890abcdef1234567890abcdef12': {
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        priceUsd: 0.55,
        timestamp: Date.now(),
      },
    },
    updatedAt: Date.now(),
  };

  beforeEach(async () => {
    // Create mock for PricesService
    pricesService = {
      getPrice: jest.fn(),
      getPrices: jest.fn(),
      refreshPrices: jest.fn(),
    } as unknown as jest.Mocked<PricesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricesController],
      providers: [
        {
          provide: PricesService,
          useValue: pricesService,
        },
      ],
    }).compile();

    controller = module.get<PricesController>(PricesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPrices', () => {
    it('should return price map for a chain', async () => {
      pricesService.getPrices.mockResolvedValue(mockPriceResponse);

      const result = await controller.getPrices(ChainId.ETHEREUM);

      expect(pricesService.getPrices).toHaveBeenCalledWith(ChainId.ETHEREUM);
      expect(result).toEqual(mockPriceResponse);
      expect(Object.keys(result.prices).length).toBe(2);
    });

    it('should handle different chains', async () => {
      const solanaPriceResponse: PriceResponse = {
        prices: {
          'SolanaTokenAddress123456789': {
            address: 'SolanaTokenAddress123456789',
            priceUsd: 150.25,
            timestamp: Date.now(),
          },
        },
        updatedAt: Date.now(),
      };

      pricesService.getPrices.mockResolvedValue(solanaPriceResponse);

      const result = await controller.getPrices(ChainId.SOLANA);

      expect(pricesService.getPrices).toHaveBeenCalledWith(ChainId.SOLANA);
      expect(result).toEqual(solanaPriceResponse);
    });
  });

  describe('getPrice', () => {
    it('should return a specific token price', async () => {
      pricesService.getPrice.mockResolvedValue(mockTokenPrice);

      const result = await controller.getPrice(
        ChainId.ETHEREUM,
        mockTokenPrice.address,
      );

      expect(pricesService.getPrice).toHaveBeenCalledWith(
        ChainId.ETHEREUM,
        mockTokenPrice.address,
      );
      expect(result).toEqual(mockTokenPrice);
    });

    it('should return null when price is not found', async () => {
      pricesService.getPrice.mockResolvedValue(null);

      const result = await controller.getPrice(
        ChainId.ETHEREUM,
        '0xnonexistent',
      );

      expect(pricesService.getPrice).toHaveBeenCalledWith(
        ChainId.ETHEREUM,
        '0xnonexistent',
      );
      expect(result).toBeNull();
    });
  });
});