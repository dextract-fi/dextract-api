import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from '@workers/cron/cron.service';
import { TokensModule } from '@services/tokens/tokens.module';
import { PricesModule } from '@services/prices/prices.module';
import { ChainAdapterFactory, createChainAdapterFactory } from '@blockchain/adapters';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TokensModule,
    PricesModule,
  ],
  providers: [
    CronService,
    {
      provide: ChainAdapterFactory,
      useFactory: createChainAdapterFactory,
    },
  ],
})
export class CronModule {}