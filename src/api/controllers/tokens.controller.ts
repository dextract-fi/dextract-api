import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TokensService } from '@services/tokens/tokens.service';
import { Token } from '@common/types/token.types';
import { ChainId } from '@common/constants/chains.constants';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get(':chainId')
  async getTokens(
    @Param('chainId', ParseIntPipe) chainId: number,
  ): Promise<Token[]> {
    return this.tokensService.getTokens(chainId as ChainId);
  }

  @Get(':chainId/:address')
  async getToken(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ): Promise<Token | null> {
    return this.tokensService.getToken(chainId as ChainId, address);
  }
}
