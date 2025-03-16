import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty({ description: 'Token address' })
  address: string;

  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Token decimals' })
  decimals: number;

  @ApiProperty({ description: 'Token logo URI', required: false })
  logoURI?: string;

  @ApiProperty({ description: 'Token tags', type: [String], required: false })
  tags?: string[];

  @ApiProperty({ description: 'Chain ID of the token' })
  chainId: number;
}