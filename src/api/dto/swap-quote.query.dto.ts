import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SwapQuoteQueryDto {
  @ApiProperty({ 
    description: 'Source token address',
    example: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC on Ethereum
  })
  @IsString()
  @IsNotEmpty()
  fromToken: string;

  @ApiProperty({ 
    description: 'Destination token address',
    example: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH on Ethereum
  })
  @IsString()
  @IsNotEmpty()
  toToken: string;

  @ApiProperty({ 
    description: 'Amount of source token to swap (in wei/lamports)',
    example: '1000000000' // 1,000 USDC (with 6 decimals)
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}