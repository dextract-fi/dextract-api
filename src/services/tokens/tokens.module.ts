import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { DataStoreModule } from '@datastore/datastore.module';
import { HttpModule } from '@nestjs/axios';
import { TokenApiAdapterFactory } from '@api-client/adapters/token';
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
    TokensService,
    TokenApiAdapterFactory,
    {
      provide: ChainAdapterFactory,
      useFactory: createChainAdapterFactory,
    },
  ],
  exports: [TokensService],
})
export class TokensModule {}
