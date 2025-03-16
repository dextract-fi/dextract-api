import { Test, TestingModule } from '@nestjs/testing';
import { DataStoreService } from '@datastore/datastore.service';
import { DATA_STORE } from '@datastore/datastore.constants';
import { DataStore } from '@common/types/datastore.types';

describe('DataStoreService', () => {
  let service: DataStoreService;
  let mockDataStore: jest.Mocked<DataStore>;

  beforeEach(async () => {
    mockDataStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataStoreService,
        {
          provide: DATA_STORE,
          useValue: mockDataStore,
        },
      ],
    }).compile();

    service = module.get<DataStoreService>(DataStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should call dataStore.get with correct parameters', async () => {
      const key = 'test-key';
      const options = { namespace: 'test-namespace' };
      
      mockDataStore.get.mockResolvedValue({ test: 'value' });
      
      const result = await service.get(key, options);
      
      expect(mockDataStore.get).toHaveBeenCalledWith(key, options);
      expect(result).toEqual({ test: 'value' });
    });
  });

  describe('set', () => {
    it('should call dataStore.set with correct parameters', async () => {
      const key = 'test-key';
      const value = { test: 'value' };
      const options = { namespace: 'test-namespace' };
      
      mockDataStore.set.mockResolvedValue(true);
      
      const result = await service.set(key, value, options);
      
      expect(mockDataStore.set).toHaveBeenCalledWith(key, value, options);
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should call dataStore.delete with correct parameters', async () => {
      const key = 'test-key';
      const options = { namespace: 'test-namespace' };
      
      mockDataStore.delete.mockResolvedValue(true);
      
      const result = await service.delete(key, options);
      
      expect(mockDataStore.delete).toHaveBeenCalledWith(key, options);
      expect(result).toBe(true);
    });
  });

  describe('has', () => {
    it('should call dataStore.has with correct parameters', async () => {
      const key = 'test-key';
      const options = { namespace: 'test-namespace' };
      
      mockDataStore.has.mockResolvedValue(true);
      
      const result = await service.has(key, options);
      
      expect(mockDataStore.has).toHaveBeenCalledWith(key, options);
      expect(result).toBe(true);
    });
  });

  describe('clear', () => {
    it('should call dataStore.clear with correct parameters', async () => {
      const options = { namespace: 'test-namespace' };
      
      mockDataStore.clear.mockResolvedValue(true);
      
      const result = await service.clear(options);
      
      expect(mockDataStore.clear).toHaveBeenCalledWith(options);
      expect(result).toBe(true);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value when it exists', async () => {
      const key = 'test-key';
      const cachedValue = { cached: 'value' };
      const valueFactory = jest.fn();
      
      mockDataStore.get.mockResolvedValue(cachedValue);
      
      const result = await service.getOrSet(key, valueFactory);
      
      expect(mockDataStore.get).toHaveBeenCalledWith(key, undefined);
      expect(valueFactory).not.toHaveBeenCalled();
      expect(result).toEqual(cachedValue);
    });

    it('should call valueFactory and set value when cache is empty', async () => {
      const key = 'test-key';
      const factoryValue = { new: 'value' };
      const valueFactory = jest.fn().mockResolvedValue(factoryValue);
      const options = { namespace: 'test-namespace', ttl: 1000 };
      
      mockDataStore.get.mockResolvedValue(null);
      mockDataStore.set.mockResolvedValue(true);
      
      const result = await service.getOrSet(key, valueFactory, options);
      
      expect(mockDataStore.get).toHaveBeenCalledWith(key, options);
      expect(valueFactory).toHaveBeenCalled();
      expect(mockDataStore.set).toHaveBeenCalledWith(key, factoryValue, options);
      expect(result).toEqual(factoryValue);
    });
  });
});