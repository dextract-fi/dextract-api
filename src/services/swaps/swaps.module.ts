import { Module } from '@nestjs/common';
import { SwapsService } from '@services/swaps/swaps.service';
import { TokensModule } from '@services/tokens/tokens.module';
import { PricesModule } from '@services/prices/prices.module';

@Module({
  imports: [TokensModule, PricesModule],
  providers: [SwapsService],
  exports: [SwapsService],
})
export class SwapsModule {}
