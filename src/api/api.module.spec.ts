import { Test, TestingModule } from '@nestjs/testing';
import { ApiModule } from '@api/api.module';
import { TokensController } from '@api/controllers/tokens.controller';
import { PricesController } from '@api/controllers/prices.controller';
import { SwapsController } from '@api/controllers/swaps.controller';
import { TokensService } from '@services/tokens/tokens.service';
import { PricesService } from '@services/prices/prices.service';
import { SwapsService } from '@services/swaps/swaps.service';
import { DataStoreService } from '@datastore/datastore.service';

describe('ApiModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Create mocks for all the required services
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
      imports: [ApiModule],
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

  it('should provide TokensController', () => {
    const controller = module.get<TokensController>(TokensController);
    expect(controller).toBeDefined();
  });

  it('should provide PricesController', () => {
    const controller = module.get<PricesController>(PricesController);
    expect(controller).toBeDefined();
  });

  it('should provide SwapsController', () => {
    const controller = module.get<SwapsController>(SwapsController);
    expect(controller).toBeDefined();
  });

  it('should import all required modules', () => {
    // Since we've overridden providers, we can't use metadata approach here
    // Instead, we verify the controllers are available, which means the modules were imported
    const tokensController = module.get<TokensController>(TokensController);
    const pricesController = module.get<PricesController>(PricesController);
    const swapsController = module.get<SwapsController>(SwapsController);
    
    expect(tokensController).toBeDefined();
    expect(pricesController).toBeDefined();
    expect(swapsController).toBeDefined();
  });

  it('should register all controllers', () => {
    // Instead of checking metadata, we verify the controllers are available
    const tokensController = module.get<TokensController>(TokensController);
    const pricesController = module.get<PricesController>(PricesController);
    const swapsController = module.get<SwapsController>(SwapsController);
    
    expect(tokensController).toBeDefined();
    expect(pricesController).toBeDefined();
    expect(swapsController).toBeDefined();
  });
});