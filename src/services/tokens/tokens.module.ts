import { Module } from '@nestjs/common';
import { TokensService } from '@services/tokens/tokens.service';

@Module({
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
