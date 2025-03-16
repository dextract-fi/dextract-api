import { Module, Global, DynamicModule } from '@nestjs/common';
import { DataStoreService } from '@datastore/datastore.service';
import { CloudflareKVStore } from '@datastore/providers/cloudflare-kv.store';
import { MemoryStore } from '@datastore/providers/memory.store';
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
            const nodeEnv = configService.get<string>('nodeEnv', 'development');
            
            // Use in-memory store for development and testing
            if (nodeEnv === 'development' || nodeEnv === 'test') {
              return new MemoryStore();
            }
            
            // Use Cloudflare KV for production
            return new CloudflareKVStore();
          },
          inject: [ConfigService],
        },
        DataStoreService,
      ],
      exports: [DataStoreService],
    };
  }
}