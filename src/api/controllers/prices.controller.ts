import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PricesService } from '@services/prices/prices.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PriceResponseDto, TokenPriceDto } from '@api/dto/price.dto';
import { ChainType, NetworkType } from '@common/types/chain.types';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  /**
   * Get all token prices for a specific chain and network
   * @param chain The chain type
   * @param network The network type
   */
  @Get(':chain/:network')
  @ApiOperation({ summary: 'Get all token prices for a specific chain and network' })
  @ApiParam({ name: 'chain', description: 'Chain type (e.g., ethereum, solana)', example: 'ethereum' })
  @ApiParam({ name: 'network', description: 'Network type (e.g., mainnet, testnet)', example: 'mainnet' })
  @ApiResponse({
    status: 200,
    description: 'Returns all token prices',
    type: PriceResponseDto
  })
  async getPrices(
    @Param('chain') chain: ChainType,
    @Param('network') network: NetworkType,
  ): Promise<PriceResponseDto> {
    return this.pricesService.getPrices(chain, network);
  }

  /**
   * Get price for a specific token
   * @param chain The chain type
   * @param network The network type
   * @param tokenId The token identifier (address or symbol)
   */
  @Get(':chain/:network/:tokenId')
  @ApiOperation({ summary: 'Get price for a specific token' })
  @ApiParam({ name: 'chain', description: 'Chain type (e.g., ethereum, solana)', example: 'ethereum' })
  @ApiParam({ name: 'network', description: 'Network type (e.g., mainnet, testnet)', example: 'mainnet' })
  @ApiParam({ 
    name: 'tokenId', 
    description: 'Token address or symbol', 
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
    @Param('chain') chain: ChainType,
    @Param('network') network: NetworkType,
    @Param('tokenId') tokenId: string,
  ): Promise<TokenPriceDto> {
    const price = await this.pricesService.getPrice(chain, network, tokenId);
    
    if (!price) {
      throw new NotFoundException(`Price for token ${tokenId} not found on ${chain}:${network}`);
    }
    
    return price;
  }
}