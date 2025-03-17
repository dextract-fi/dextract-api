import { ApiProperty } from '@nestjs/swagger';

export class SwapRouteDto {
  @ApiProperty({ description: 'Source token address' })
  fromToken: string;

  @ApiProperty({ description: 'Destination token address' })
  toToken: string;

  @ApiProperty({ description: 'Amount of source token to swap (in wei/lamports)' })
  fromAmount: string;

  @ApiProperty({ description: 'Expected amount of destination token to receive (in wei/lamports)' })
  toAmount: string;

  @ApiProperty({ description: 'Price impact of the swap as a percentage' })
  priceImpact: number;

  @ApiProperty({ description: 'Token addresses in the swap path', type: [String] })
  path: string[];

  @ApiProperty({ description: 'DEX providers used in the route', type: [String] })
  providers: string[];

  @ApiProperty({ description: 'Estimated gas cost (in wei/lamports)', required: false })
  estimatedGas?: string;
}

export class SwapQuoteDto {
  @ApiProperty({ description: 'All available swap routes', type: [SwapRouteDto] })
  routes: SwapRouteDto[];

  @ApiProperty({ description: 'Best swap route based on output amount' })
  bestRoute: SwapRouteDto;

  @ApiProperty({ description: 'Source token address' })
  fromToken: string;

  @ApiProperty({ description: 'Destination token address' })
  toToken: string;

  @ApiProperty({ description: 'Amount of source token to swap (in wei/lamports)' })
  fromAmount: string;

  @ApiProperty({ description: 'Timestamp when the quote was generated' })
  updatedAt: number;
}