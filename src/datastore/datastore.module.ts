import { Module, Global, DynamicModule } from '@nestjs/common';
import { DataStoreService } from '@datastore/datastore.service';
import { CloudflareKVStore } from '@datastore/providers/cloudflare-kv.store';
import { DATA_STORE } from '@datastore/datastore.constants';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({})
export class DataStoreModule {
  static forRoot(): DynamicModule {
    return {
      module: DataStoreModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: DATA_STORE,
          useFactory: (configService: ConfigService) => {
            // Always use CloudflareKVStore, which works with both Miniflare locally
            // and Cloudflare Workers in production
            return new CloudflareKVStore(configService);
          },
          inject: [ConfigService],
        },
        DataStoreService,
      ],
      exports: [DataStoreService],
    };
  }
}