import { ApiProperty } from '@nestjs/swagger';

export class TokenPriceDto {
  @ApiProperty({ description: 'Token address' })
  address: string;

  @ApiProperty({ description: 'Token price in USD' })
  priceUsd: number;

  @ApiProperty({ description: 'Price timestamp' })
  timestamp: number;

  @ApiProperty({ description: '24-hour price change percentage', required: false })
  change24h?: number;

  @ApiProperty({ description: '7-day price change percentage', required: false })
  change7d?: number;

  @ApiProperty({ description: '24-hour trading volume in USD', required: false })
  volume24h?: number;

  @ApiProperty({ description: 'Token market capitalization in USD', required: false })
  marketCap?: number;
}

export class PriceResponseDto {
  @ApiProperty({ 
    description: 'Map of token addresses to their price information',
    type: 'object',
    additionalProperties: { type: 'object', $ref: '#/components/schemas/TokenPriceDto' }
  })
  prices: Record<string, TokenPriceDto>;

  @ApiProperty({ description: 'Timestamp when prices were last updated' })
  updatedAt: number;
}