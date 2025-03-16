import { Module } from '@nestjs/common';
import { TokensController } from '@api/controllers/tokens.controller';
import { PricesController } from '@api/controllers/prices.controller';
import { SwapsController } from '@api/controllers/swaps.controller';
import { TokensModule } from '@services/tokens/tokens.module';
import { PricesModule } from '@services/prices/prices.module';
import { SwapsModule } from '@services/swaps/swaps.module';

@Module({
  imports: [
    TokensModule,
    PricesModule,
    SwapsModule,
  ],
  controllers: [
    TokensController,
    PricesController,
    SwapsController,
  ],
})
export class ApiModule {}
