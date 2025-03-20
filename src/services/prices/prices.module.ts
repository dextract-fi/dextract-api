import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { DataStoreModule } from '@datastore/datastore.module';
import { HttpModule } from '@nestjs/axios';
import { PriceApiAdapterFactory } from '@api-client/adapters/price';
import { ChainAdapterFactory, createChainAdapterFactory } from '@blockchain/adapters';

@Module({
  imports: [
    DataStoreModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    PricesService,
    PriceApiAdapterFactory,
    {
      provide: ChainAdapterFactory,
      useFactory: createChainAdapterFactory,
    },
  ],
  exports: [PricesService],
})
export class PricesModule {}
