import { CloudflareKVStore } from '@datastore/providers/cloudflare-kv.store';
import { DataStoreValue } from '@common/types/datastore.types';

describe('CloudflareKVStore', () => {
  let store: CloudflareKVStore;
  let mockKV: any; // Use any to avoid TypeScript issues with the mock
  
  const testNamespace = 'test-namespace';
  const defaultNamespace = 'default';
  const testKey = 'test-key';
  const testValue = { test: 'value' };

  beforeEach(() => {
    // Create a more flexible mock for KV namespace
    mockKV = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      getWithMetadata: jest.fn(),
    };
    
    // Assign the mock to the global variable
    (global as any).DEXTRACT_KV = mockKV;
    
    store = new CloudflareKVStore();
  });

  describe('get', () => {
    it('should return null for non-existent keys', async () => {
      mockKV.get.mockResolvedValue(null);
      
      const value = await store.get('non-existent');
      
      expect(mockKV.get).toHaveBeenCalledWith(`${defaultNamespace}:non-existent`, 'json');
      expect(value).toBeNull();
    });

    it('should return the value for an existing key', async () => {
      const storeValue: DataStoreValue = {
        value: testValue,
        expiresAt: Date.now() + 1000,
      };
      
      // Mock the implementation instead of using mockResolvedValue to avoid type issues
      mockKV.get.mockImplementation(() => Promise.resolve(storeValue));
      
      const value = await store.get(testKey);
      
      expect(mockKV.get).toHaveBeenCalledWith(`${defaultNamespace}:${testKey}`, 'json');
      expect(value).toEqual(testValue);
    });

    it('should respect namespace isolation', async () => {
      const storeValue: DataStoreValue = {
        value: testValue,
        expiresAt: Date.now() + 1000,
      };
      
      mockKV.get.mockImplementation((key: string) => {
        if (key === `${testNamespace}:${testKey}`) {
          return Promise.resolve(storeValue);
        }
        return Promise.resolve(null);
      });
      
      const valueFromDefault = await store.get(testKey);
      expect(valueFromDefault).toBeNull();
      
      const valueFromTest = await store.get(testKey, { namespace: testNamespace });
      expect(valueFromTest).toEqual(testValue);
    });

    it('should return null and delete expired values', async () => {
      const expiredValue: DataStoreValue = {
        value: testValue,
        expiresAt: Date.now() - 1000, // Already expired
      };
      
      mockKV.get.mockImplementation(() => Promise.resolve(expiredValue));
      
      const value = await store.get(testKey);
      
      expect(mockKV.get).toHaveBeenCalledWith(`${defaultNamespace}:${testKey}`, 'json');
      expect(mockKV.delete).toHaveBeenCalledWith(`${defaultNamespace}:${testKey}`);
      expect(value).toBeNull();
    });

    it('should handle errors and return null', async () => {
      mockKV.get.mockImplementation(() => Promise.reject(new Error('KV error')));
      
      const value = await store.get(testKey);
      
      expect(value).toBeNull();
    });
  });

  describe('set', () => {
    it('should store a value successfully', async () => {
      mockKV.put.mockImplementation(() => Promise.resolve());
      
      const result = await store.set(testKey, testValue);
      
      expect(result).toBe(true);
      expect(mockKV.put).toHaveBeenCalledWith(
        `${defaultNamespace}:${testKey}`,
        expect.any(String),
        expect.objectContaining({
          expirationTtl: expect.any(Number),
        })
      );
    });

    it('should pass the correct TTL to Cloudflare KV', async () => {
      mockKV.put.mockImplementation(() => Promise.resolve());
      
      const ttl = 300000; // 5 minutes
      await store.set(testKey, testValue, { ttl });
      
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          expirationTtl: Math.ceil(ttl / 1000), // Should convert to seconds
        })
      );
    });

    it('should handle errors and return false', async () => {
      mockKV.put.mockImplementation(() => Promise.reject(new Error('KV error')));
      
      const result = await store.set(testKey, testValue);
      
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an existing key', async () => {
      mockKV.delete.mockImplementation(() => Promise.resolve());
      
      const result = await store.delete(testKey);
      
      expect(result).toBe(true);
      expect(mockKV.delete).toHaveBeenCalledWith(`${defaultNamespace}:${testKey}`);
    });

    it('should respect namespace when deleting', async () => {
      mockKV.delete.mockImplementation(() => Promise.resolve());
      
      await store.delete(testKey, { namespace: testNamespace });
      
      expect(mockKV.delete).toHaveBeenCalledWith(`${testNamespace}:${testKey}`);
    });

    it('should handle errors and return false', async () => {
      mockKV.delete.mockImplementation(() => Promise.reject(new Error('KV error')));
      
      const result = await store.delete(testKey);
      
      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      const storeValue: DataStoreValue = {
        value: testValue,
        expiresAt: Date.now() + 1000,
      };
      
      mockKV.get.mockImplementation(() => Promise.resolve(storeValue));
      
      const result = await store.has(testKey);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      mockKV.get.mockImplementation(() => Promise.resolve(null));
      
      const result = await store.has('non-existent');
      
      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      mockKV.get.mockImplementation(() => Promise.reject(new Error('KV error')));
      
      const result = await store.has(testKey);
      
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all keys in the specified namespace', async () => {
      const mockListResult = {
        keys: [
          { name: `${testNamespace}:key1` },
          { name: `${testNamespace}:key2` },
        ],
        list_complete: true,
        cacheStatus: null, // Added to match Cloudflare's type
      };
      
      mockKV.list.mockImplementation(() => Promise.resolve(mockListResult));
      mockKV.delete.mockImplementation(() => Promise.resolve());
      
      const result = await store.clear({ namespace: testNamespace });
      
      expect(result).toBe(true);
      expect(mockKV.list).toHaveBeenCalledWith({ prefix: `${testNamespace}:` });
      expect(mockKV.delete).toHaveBeenCalledTimes(2);
      expect(mockKV.delete).toHaveBeenCalledWith(`${testNamespace}:key1`);
      expect(mockKV.delete).toHaveBeenCalledWith(`${testNamespace}:key2`);
    });

    it('should handle empty list results', async () => {
      const mockEmptyListResult = {
        keys: [],
        list_complete: true,
        cacheStatus: null, // Added to match Cloudflare's type
      };
      
      mockKV.list.mockImplementation(() => Promise.resolve(mockEmptyListResult));
      
      const result = await store.clear();
      
      expect(result).toBe(true);
      expect(mockKV.delete).not.toHaveBeenCalled();
    });

    it('should handle errors and return false', async () => {
      mockKV.list.mockImplementation(() => Promise.reject(new Error('KV error')));
      
      const result = await store.clear();
      
      expect(result).toBe(false);
    });
  });

  describe('getFullKey', () => {
    it('should correctly format keys with namespace', async () => {
      // @ts-ignore - Testing private method
      const fullKey = store['getFullKey']('key', 'namespace');
      expect(fullKey).toBe('namespace:key');
    });
  });
});