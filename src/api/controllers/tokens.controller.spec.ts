import { Test, TestingModule } from '@nestjs/testing';
import { TokensController } from '@api/controllers/tokens.controller';
import { TokensService } from '@services/tokens/tokens.service';
import { ChainType, NetworkType } from '@common/types/chain.types';
import { Token } from '@exchange/types/token.types';
import { NotFoundException } from '@nestjs/common';

describe('TokensController', () => {
  let controller: TokensController;
  let tokensService: jest.Mocked<TokensService>;

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

  const mockTokenList: Token[] = [
    mockToken,
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      symbol: 'TKN2',
      name: 'Token 2',
      decimals: 6,
      chainType: 'ethereum',
      networkType: 'mainnet',
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

      const result = await controller.getTokens('ethereum', 'mainnet');

      expect(tokensService.getTokens).toHaveBeenCalledWith('ethereum', 'mainnet');
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
          chainType: 'solana',
          networkType: 'mainnet',
        },
      ];

      tokensService.getTokens.mockResolvedValue(solanaTokens);

      const result = await controller.getTokens('solana', 'mainnet');

      expect(tokensService.getTokens).toHaveBeenCalledWith('solana', 'mainnet');
      expect(result).toEqual(solanaTokens);
    });
  });

  describe('getToken', () => {
    it('should return a specific token', async () => {
      tokensService.getToken.mockResolvedValue(mockToken);

      const result = await controller.getToken(
        'ethereum',
        'mainnet',
        mockToken.address,
      );

      expect(tokensService.getToken).toHaveBeenCalledWith(
        'ethereum',
        'mainnet',
        mockToken.address,
      );
      expect(result).toEqual(mockToken);
    });

    it('should throw NotFoundException when token is not found', async () => {
      tokensService.getToken.mockResolvedValue(null);

      await expect(controller.getToken(
        'ethereum',
        'mainnet',
        '0xnonexistent',
      )).rejects.toThrow(NotFoundException);

      expect(tokensService.getToken).toHaveBeenCalledWith(
        'ethereum',
        'mainnet',
        '0xnonexistent',
      );
    });
  });
});