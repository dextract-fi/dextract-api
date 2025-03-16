import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PricesService } from '@services/prices/prices.service';
import { ChainId } from '@exchange/constants/chains.constants';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PriceResponseDto, TokenPriceDto } from '@api/dto/price.dto';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get(':chainId')
  @ApiOperation({ summary: 'Get all token prices for a specific chain' })
  @ApiParam({ name: 'chainId', description: 'Chain ID', example: ChainId.ETHEREUM })
  @ApiResponse({
    status: 200,
    description: 'Returns all token prices',
    type: PriceResponseDto
  })
  async getPrices(
    @Param('chainId', ParseIntPipe) chainId: number,
  ): Promise<PriceResponseDto> {
    return this.pricesService.getPrices(chainId as ChainId);
  }

  @Get(':chainId/:address')
  @ApiOperation({ summary: 'Get price for a specific token' })
  @ApiParam({ name: 'chainId', description: 'Chain ID', example: ChainId.ETHEREUM })
  @ApiParam({ 
    name: 'address', 
    description: 'Token address', 
    example: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC on Ethereum
  })
  @ApiResponse({
    status: 200,
    description: 'Returns token price information',
    type: TokenPriceDto
  })
  @ApiResponse({
    status: 404,
    description: 'Token price not found'
  })
  async getPrice(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ): Promise<TokenPriceDto | null> {
    return this.pricesService.getPrice(chainId as ChainId, address);
  }
}