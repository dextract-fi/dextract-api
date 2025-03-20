import { ApiProperty } from '@nestjs/swagger';
import { ChainType, NetworkType } from '@common/types/chain.types';

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

  @ApiProperty({ description: 'Legacy chain ID of the token', required: false })
  chainId?: number;

  @ApiProperty({ description: 'Chain type of the token', enum: ['ethereum', 'solana', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche'] })
  chainType: ChainType;

  @ApiProperty({ description: 'Network type of the token', enum: ['mainnet', 'testnet', 'devnet', 'localnet'] })
  networkType: NetworkType;
}