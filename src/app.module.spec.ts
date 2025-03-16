import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@app/app.module';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { ConfigService } from '@nestjs/config';
import { ApiModule } from '@api/api.module';
import { CronModule } from '@workers/cron/cron.module';
import { DataStoreService } from '@datastore/datastore.service';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { SwapsService } from '@services/swaps/swaps.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Create mocks for all services
    const mockDataStoreService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      getOrSet: jest.fn(),
    };

    const mockTokensService = {
      getToken: jest.fn(),
      getTokens: jest.fn(),
      refreshTokens: jest.fn(),
    };

    const mockPricesService = {
      getPrice: jest.fn(),
      getPrices: jest.fn(),
      refreshPrices: jest.fn(),
    };

    const mockSwapsService = {
      getQuote: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataStoreService)
      .useValue(mockDataStoreService)
      .overrideProvider(TokensService)
      .useValue(mockTokensService)
      .overrideProvider(PricesService)
      .useValue(mockPricesService)
      .overrideProvider(SwapsService)
      .useValue(mockSwapsService)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
  });

  it('should provide AppService', () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
  });

  it('should import all required modules', () => {
    // Check that we can get instances from each imported module
    
    // ConfigModule should make ConfigService available
    const configService = module.get(ConfigService);
    expect(configService).toBeDefined();
    
    // DataStoreModule should make DataStoreService available
    const dataStoreService = module.get(DataStoreService);
    expect(dataStoreService).toBeDefined();
    
    // ApiModule should be registered
    expect(() => module.get(ApiModule)).not.toThrow();
    
    // CronModule should be registered
    expect(() => module.get(CronModule)).not.toThrow();
  });
});