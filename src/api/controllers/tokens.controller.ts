import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { TokensService } from '@services/tokens/tokens.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenDto } from '@api/dto/token.dto';
import { ChainType, NetworkType } from '@common/types/chain.types';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  /**
   * Get all tokens for a specific chain and network
   * @param chain The chain type
   * @param network The network type
   */
  @Get(':chain/:network')
  @ApiOperation({ summary: 'Get all tokens for a specific chain and network' })
  @ApiParam({ name: 'chain', description: 'Chain type (e.g., ethereum, solana)', example: 'ethereum' })
  @ApiParam({ name: 'network', description: 'Network type (e.g., mainnet, testnet)', example: 'mainnet' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of tokens',
    type: [TokenDto]
  })
  async getTokens(
    @Param('chain') chain: ChainType,
    @Param('network') network: NetworkType,
  ): Promise<TokenDto[]> {
    return this.tokensService.getTokens(chain, network);
  }

  /**
   * Get a specific token by address or symbol
   * @param chain The chain type
   * @param network The network type
   * @param tokenId The token identifier (address or symbol)
   */
  @Get(':chain/:network/:tokenId')
  @ApiOperation({ summary: 'Get a specific token by address or symbol' })
  @ApiParam({ name: 'chain', description: 'Chain type (e.g., ethereum, solana)', example: 'ethereum' })
  @ApiParam({ name: 'network', description: 'Network type (e.g., mainnet, testnet)', example: 'mainnet' })
  @ApiParam({ 
    name: 'tokenId', 
    description: 'Token address or symbol', 
    example: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC on Ethereum
  })
  @ApiResponse({
    status: 200,
    description: 'Returns token information',
    type: TokenDto
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getToken(
    @Param('chain') chain: ChainType,
    @Param('network') network: NetworkType,
    @Param('tokenId') tokenId: string,
  ): Promise<TokenDto> {
    const token = await this.tokensService.getToken(chain, network, tokenId);
    
    if (!token) {
      throw new NotFoundException(`Token ${tokenId} not found on ${chain}:${network}`);
    }
    
    return token;
  }
}