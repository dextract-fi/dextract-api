import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PricesService } from '@services/prices/prices.service';
import { PriceResponse, TokenPrice } from '@common/types/price.types';
import { ChainId } from '@common/constants/chains.constants';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get(':chainId')
  async getPrices(
    @Param('chainId', ParseIntPipe) chainId: number,
  ): Promise<PriceResponse> {
    return this.pricesService.getPrices(chainId as ChainId);
  }

  @Get(':chainId/:address')
  async getPrice(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ): Promise<TokenPrice | null> {
    return this.pricesService.getPrice(chainId as ChainId, address);
  }
}
