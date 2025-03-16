import { Test, TestingModule } from '@nestjs/testing';
import { TokensController } from '@api/controllers/tokens.controller';
import { TokensService } from '@services/tokens/tokens.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { Token } from '@exchange/types/token.types';

describe('TokensController', () => {
  let controller: TokensController;
  let tokensService: jest.Mocked<TokensService>;

  const mockToken: Token = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    chainId: ChainId.ETHEREUM,
    logoURI: 'https://example.com/logo.png',
    tags: ['stablecoin'],
  };

  const mockTokenList: Token[] = [
    mockToken,
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      symbol: 'TKN2',
      name: 'Token 2',
      decimals: 6,
      chainId: ChainId.ETHEREUM,
    },
  ];

  beforeEach(async () => {
    // Create mock for TokensService
    tokensService = {
      getToken: jest.fn(),
      getTokens: jest.fn(),
      refreshTokens: jest.fn(),
    } as unknown as jest.Mocked<TokensService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [
        {
          provide: TokensService,
          useValue: tokensService,
        },
      ],
    }).compile();

    controller = module.get<TokensController>(TokensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTokens', () => {
    it('should return array of tokens for a chain', async () => {
      tokensService.getTokens.mockResolvedValue(mockTokenList);

      const result = await controller.getTokens(ChainId.ETHEREUM);

      expect(tokensService.getTokens).toHaveBeenCalledWith(ChainId.ETHEREUM);
      expect(result).toEqual(mockTokenList);
      expect(result.length).toBe(2);
    });

    it('should handle different chains', async () => {
      const solanaTokens: Token[] = [
        {
          address: 'SolanaTokenAddress123456789',
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          chainId: ChainId.SOLANA,
        },
      ];

      tokensService.getTokens.mockResolvedValue(solanaTokens);

      const result = await controller.getTokens(ChainId.SOLANA);

      expect(tokensService.getTokens).toHaveBeenCalledWith(ChainId.SOLANA);
      expect(result).toEqual(solanaTokens);
    });
  });

  describe('getToken', () => {
    it('should return a specific token', async () => {
      tokensService.getToken.mockResolvedValue(mockToken);

      const result = await controller.getToken(
        ChainId.ETHEREUM,
        mockToken.address,
      );

      expect(tokensService.getToken).toHaveBeenCalledWith(
        ChainId.ETHEREUM,
        mockToken.address,
      );
      expect(result).toEqual(mockToken);
    });

    it('should return null when token is not found', async () => {
      tokensService.getToken.mockResolvedValue(null);

      const result = await controller.getToken(
        ChainId.ETHEREUM,
        '0xnonexistent',
      );

      expect(tokensService.getToken).toHaveBeenCalledWith(
        ChainId.ETHEREUM,
        '0xnonexistent',
      );
      expect(result).toBeNull();
    });
  });
});