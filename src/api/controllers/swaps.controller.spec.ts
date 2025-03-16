import { Test, TestingModule } from '@nestjs/testing';
import { SwapsController } from '@api/controllers/swaps.controller';
import { SwapsService } from '@services/swaps/swaps.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { SwapQuote, SwapRoute } from '@exchange/types/swap.types';

describe('SwapsController', () => {
  let controller: SwapsController;
  let swapsService: jest.Mocked<SwapsService>;

  const mockSourceTokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockDestTokenAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
  const mockAmount = '1000000000000000000'; // 1 token in wei

  const mockRoute: SwapRoute = {
    fromToken: mockSourceTokenAddress,
    toToken: mockDestTokenAddress,
    fromAmount: mockAmount,
    toAmount: '1000000', // 1 DEST token (with 6 decimals)
    priceImpact: 0.01,
    path: [mockSourceTokenAddress, mockDestTokenAddress],
    providers: ['TestDEX'],
    estimatedGas: '150000',
  };

  const mockQuote: SwapQuote = {
    routes: [mockRoute],
    bestRoute: mockRoute,
    fromToken: mockSourceTokenAddress,
    toToken: mockDestTokenAddress,
    fromAmount: mockAmount,
    updatedAt: Date.now(),
  };

  beforeEach(async () => {
    // Create mock for SwapsService
    swapsService = {
      getQuote: jest.fn(),
    } as unknown as jest.Mocked<SwapsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwapsController],
      providers: [
        {
          provide: SwapsService,
          useValue: swapsService,
        },
      ],
    }).compile();

    controller = module.get<SwapsController>(SwapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuote', () => {
    it('should return swap quote with all parameters', async () => {
      swapsService.getQuote.mockResolvedValue(mockQuote);

      const result = await controller.getQuote(
        ChainId.ETHEREUM,
        mockSourceTokenAddress,
        mockDestTokenAddress,
        mockAmount,
      );

      expect(swapsService.getQuote).toHaveBeenCalledWith(
        ChainId.ETHEREUM,
        mockSourceTokenAddress,
        mockDestTokenAddress,
        mockAmount,
      );
      expect(result).toEqual(mockQuote);
      expect(result.routes.length).toBe(1);
      expect(result.bestRoute).toEqual(mockRoute);
    });

    it('should handle Solana chain', async () => {
      const solanaMockSourceTokenAddress = 'SolSourceTokenAddress12345';
      const solanaMockDestTokenAddress = 'SolDestTokenAddress67890';
      
      const solanaRoute: SwapRoute = {
        ...mockRoute,
        fromToken: solanaMockSourceTokenAddress,
        toToken: solanaMockDestTokenAddress,
        path: [solanaMockSourceTokenAddress, solanaMockDestTokenAddress],
      };
      
      const solanaQuote: SwapQuote = {
        ...mockQuote,
        routes: [solanaRoute],
        bestRoute: solanaRoute,
        fromToken: solanaMockSourceTokenAddress,
        toToken: solanaMockDestTokenAddress,
      };

      swapsService.getQuote.mockResolvedValue(solanaQuote);

      const result = await controller.getQuote(
        ChainId.SOLANA,
        solanaMockSourceTokenAddress,
        solanaMockDestTokenAddress,
        mockAmount,
      );

      expect(swapsService.getQuote).toHaveBeenCalledWith(
        ChainId.SOLANA,
        solanaMockSourceTokenAddress,
        solanaMockDestTokenAddress,
        mockAmount,
      );
      expect(result).toEqual(solanaQuote);
    });

    it('should handle errors from SwapsService', async () => {
      const errorMessage = 'No routes found';
      swapsService.getQuote.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getQuote(
        ChainId.ETHEREUM,
        mockSourceTokenAddress,
        mockDestTokenAddress,
        mockAmount,
      )).rejects.toThrow(errorMessage);
    });

    it('should handle different token amounts', async () => {
      const smallAmount = '100000000000000000'; // 0.1 token
      
      // Create new mock quote with the smaller amount
      const smallQuote: SwapQuote = {
        ...mockQuote,
        fromAmount: smallAmount,
        routes: [{ ...mockRoute, fromAmount: smallAmount, toAmount: '100000' }],
        bestRoute: { ...mockRoute, fromAmount: smallAmount, toAmount: '100000' },
      };
      
      swapsService.getQuote.mockResolvedValue(smallQuote);

      const result = await controller.getQuote(
        ChainId.ETHEREUM,
        mockSourceTokenAddress,
        mockDestTokenAddress,
        smallAmount,
      );

      expect(swapsService.getQuote).toHaveBeenCalledWith(
        ChainId.ETHEREUM,
        mockSourceTokenAddress,
        mockDestTokenAddress,
        smallAmount,
      );
      expect(result).toEqual(smallQuote);
      expect(result.fromAmount).toBe(smallAmount);
    });
  });
});