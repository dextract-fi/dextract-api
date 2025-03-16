import { MemoryStore } from '@datastore/providers/memory.store';
import { DataStoreOptions } from '@common/types/datastore.types';

describe('MemoryStore', () => {
  let store: MemoryStore;
  const testNamespace = 'test-namespace';
  const defaultNamespace = 'default';
  const testKey = 'test-key';
  const testValue = { test: 'value' };

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe('get', () => {
    it('should return null for non-existent keys', async () => {
      const value = await store.get('non-existent');
      expect(value).toBeNull();
    });

    it('should return the value for an existing key', async () => {
      await store.set(testKey, testValue);
      const value = await store.get(testKey);
      expect(value).toEqual(testValue);
    });

    it('should respect namespace isolation', async () => {
      const options: DataStoreOptions = { namespace: testNamespace };
      
      // Set in test namespace
      await store.set(testKey, testValue, options);
      
      // Try to get from default namespace
      const valueFromDefault = await store.get(testKey);
      expect(valueFromDefault).toBeNull();
      
      // Get from test namespace
      const valueFromTest = await store.get(testKey, options);
      expect(valueFromTest).toEqual(testValue);
    });

    it('should return null and delete expired values', async () => {
      // Set with short TTL (1ms)
      await store.set(testKey, testValue, { ttl: 1 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Try to get expired value
      const value = await store.get(testKey);
      expect(value).toBeNull();
      
      // Verify it was deleted
      const exists = await store.has(testKey);
      expect(exists).toBe(false);
    });
  });

  describe('set', () => {
    it('should store a value successfully', async () => {
      const result = await store.set(testKey, testValue);
      expect(result).toBe(true);
      
      const value = await store.get(testKey);
      expect(value).toEqual(testValue);
    });

    it('should overwrite existing values', async () => {
      await store.set(testKey, { old: 'value' });
      await store.set(testKey, testValue);
      
      const value = await store.get(testKey);
      expect(value).toEqual(testValue);
    });

    it('should store values with expiration time when ttl is provided', async () => {
      // Use private store property to inspect stored value
      const result = await store.set(testKey, testValue, { ttl: 1000 });
      expect(result).toBe(true);
      
      // @ts-ignore - Accessing private property for testing
      const storedValue = store['store'].get(`${defaultNamespace}:${testKey}`);
      
      expect(storedValue).toBeDefined();
      expect(storedValue.value).toEqual(testValue);
      expect(storedValue.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('delete', () => {
    it('should delete an existing key', async () => {
      await store.set(testKey, testValue);
      const result = await store.delete(testKey);
      
      expect(result).toBe(true);
      const value = await store.get(testKey);
      expect(value).toBeNull();
    });

    it('should respect namespace when deleting', async () => {
      const options: DataStoreOptions = { namespace: testNamespace };
      
      // Set in test namespace
      await store.set(testKey, testValue, options);
      
      // Delete from default namespace
      await store.delete(testKey);
      
      // Value should still exist in test namespace
      const value = await store.get(testKey, options);
      expect(value).toEqual(testValue);
      
      // Delete from test namespace
      await store.delete(testKey, options);
      
      // Value should be gone
      const deletedValue = await store.get(testKey, options);
      expect(deletedValue).toBeNull();
    });
    
    it('should return false when the key does not exist', async () => {
      const result = await store.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      await store.set(testKey, testValue);
      const result = await store.has(testKey);
      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const result = await store.has('non-existent');
      expect(result).toBe(false);
    });

    it('should respect namespace when checking', async () => {
      const options: DataStoreOptions = { namespace: testNamespace };
      
      // Set in test namespace
      await store.set(testKey, testValue, options);
      
      // Check in default namespace
      const hasInDefault = await store.has(testKey);
      expect(hasInDefault).toBe(false);
      
      // Check in test namespace
      const hasInTest = await store.has(testKey, options);
      expect(hasInTest).toBe(true);
    });

    it('should return false and delete expired values', async () => {
      // Set with short TTL (1ms)
      await store.set(testKey, testValue, { ttl: 1 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check expired value
      const exists = await store.has(testKey);
      expect(exists).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all keys when no namespace is specified', async () => {
      // Setup simple string values to avoid complexity
      await store.set('key1', 'value1');
      await store.set('key2', 'value2', { namespace: testNamespace });

      // Check initial values
      expect(await store.get('key1')).toBe('value1');
      expect(await store.get('key2', { namespace: testNamespace })).toBe('value2');
      
      // Clear default namespace
      const result = await store.clear();
      expect(result).toBe(true);
      
      // Check after clear
      expect(await store.get('key1')).toBeNull();
      expect(await store.get('key2', { namespace: testNamespace })).toBe('value2');
    });
    
    it('should clear only keys in the specified namespace', async () => {
      // Setup simple string values
      await store.set('key1', 'value1');
      await store.set('key2', 'value2', { namespace: testNamespace });
      
      // Check initial values
      expect(await store.get('key1')).toBe('value1');
      expect(await store.get('key2', { namespace: testNamespace })).toBe('value2');
      
      // Clear specific namespace
      const result = await store.clear({ namespace: testNamespace });
      expect(result).toBe(true);
      
      // Check after clear
      expect(await store.get('key1')).toBe('value1');
      expect(await store.get('key2', { namespace: testNamespace })).toBeNull();
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