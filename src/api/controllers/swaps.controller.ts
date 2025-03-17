import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SwapsService } from '@services/swaps/swaps.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwapQuoteDto } from '@api/dto/swap.dto';
import { SwapQuoteQueryDto } from '@api/dto/swap-quote.query.dto';

@ApiTags('swaps')
@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) {}

  @Get('quote/:chainId')
  @ApiOperation({ summary: 'Get swap quote' })
  @ApiParam({ name: 'chainId', description: 'Chain ID', example: ChainId.ETHEREUM })
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
    @Param('chainId', ParseIntPipe) chainId: number,
    @Query() query: SwapQuoteQueryDto,
  ): Promise<SwapQuoteDto> {
    return this.swapsService.getQuote(
      chainId as ChainId,
      query.fromToken,
      query.toToken,
      query.amount,
    );
  }
}