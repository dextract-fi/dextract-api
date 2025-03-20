import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { SwapsService } from '@services/swaps/swaps.service';
import { ChainType, NetworkType } from '@common/types/chain.types';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwapQuoteDto } from '@api/dto/swap.dto';
import { SwapQuoteQueryDto } from '@api/dto/swap-quote.query.dto';

@ApiTags('swaps')
@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) {}

  @Get('quote/:chain/:network')
  @ApiOperation({ summary: 'Get swap quote' })
  @ApiParam({ name: 'chain', description: 'Chain type (e.g., ethereum, solana)', example: 'ethereum' })
  @ApiParam({ name: 'network', description: 'Network type (e.g., mainnet, testnet)', example: 'mainnet' })
  @ApiResponse({
    status: 200,
    description: 'Returns swap quote information',
    type: SwapQuoteDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters'
  })
  @ApiResponse({
    status: 404,
    description: 'No routes found'
  })
  async getQuote(
    @Param('chain') chain: ChainType,
    @Param('network') network: NetworkType,
    @Query() query: SwapQuoteQueryDto,
  ): Promise<SwapQuoteDto> {
    return this.swapsService.getQuote(
      chain,
      network,
      query.fromToken,
      query.toToken,
      query.amount,
    );
  }
}