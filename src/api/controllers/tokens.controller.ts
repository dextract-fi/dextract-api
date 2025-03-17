import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TokensService } from '@services/tokens/tokens.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenDto } from '@api/dto/token.dto';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get(':chainId')
  @ApiOperation({ summary: 'Get all tokens for a specific chain' })
  @ApiParam({ name: 'chainId', description: 'Chain ID', example: ChainId.ETHEREUM })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of tokens',
    type: [TokenDto]
  })
  async getTokens(
    @Param('chainId', ParseIntPipe) chainId: number,
  ): Promise<TokenDto[]> {
    return this.tokensService.getTokens(chainId as ChainId);
  }

  @Get(':chainId/:address')
  @ApiOperation({ summary: 'Get a specific token by address' })
  @ApiParam({ name: 'chainId', description: 'Chain ID', example: ChainId.ETHEREUM })
  @ApiParam({ 
    name: 'address', 
    description: 'Token address', 
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
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ): Promise<TokenDto | null> {
    return this.tokensService.getToken(chainId as ChainId, address);
  }
}