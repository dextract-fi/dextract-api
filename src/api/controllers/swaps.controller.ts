import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SwapsService } from '@services/swaps/swaps.service';
import { SwapQuote } from 'packages/exchange/types/swap.types';
import { ChainId } from 'packages/exchange/constants/chains.constants';

@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) {}

  @Get('quote/:chainId')
  async getQuote(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Query('fromToken') fromToken: string,
    @Query('toToken') toToken: string,
    @Query('amount') amount: string,
  ): Promise<SwapQuote> {
    return this.swapsService.getQuote(
      chainId as ChainId,
      fromToken,
      toToken,
      amount,
    );
  }
}
