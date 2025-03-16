import { Injectable, Logger } from '@nestjs/common';
import { DataStore, DataStoreOptions, DataStoreValue } from '@common/types/datastore.types';

@Injectable()
export class CloudflareKVStore implements DataStore {
  private readonly logger = new Logger(CloudflareKVStore.name);
  private readonly DEFAULT_NAMESPACE = 'default';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor() {
    this.logger.log('Initializing Cloudflare KV store');
  }

  async get<T = any>(key: string, options?: DataStoreOptions): Promise<T | null> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      const fullKey = this.getFullKey(key, namespace);
      
      // Access KV through the Cloudflare Workers KV namespace
      const value = await DEXTRACT_KV.get(fullKey, 'json');
      
      if (!value) {
        return null;
      }
      
      const typedValue = value as DataStoreValue<T>;
      
      // Check if value has expired
      if (typedValue.expiresAt && typedValue.expiresAt < Date.now()) {
        await this.delete(key, options);
        return null;
      }
      
      return typedValue.value;
    } catch (error) {
      this.logger.error(`Error getting value for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options?: DataStoreOptions): Promise<boolean> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      const ttl = options?.ttl || this.DEFAULT_TTL;
      const fullKey = this.getFullKey(key, namespace);
      
      const storeValue: DataStoreValue<T> = {
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
      };
      
      // Set the value in KV store with explicit TTL for Cloudflare's expiration
      const kvOptions = ttl ? { expirationTtl: Math.ceil(ttl / 1000) } : undefined;
      await DEXTRACT_KV.put(fullKey, JSON.stringify(storeValue), kvOptions);
      
      return true;
    } catch (error) {
      this.logger.error(`Error setting value for key ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(key: string, options?: DataStoreOptions): Promise<boolean> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      const fullKey = this.getFullKey(key, namespace);
      
      await DEXTRACT_KV.delete(fullKey);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error.message}`);
      return false;
    }
  }

  async has(key: string, options?: DataStoreOptions): Promise<boolean> {
    try {
      const value = await this.get(key, options);
      return value !== null;
    } catch (error) {
      this.logger.error(`Error checking key ${key}: ${error.message}`);
      return false;
    }
  }

  async clear(options?: DataStoreOptions): Promise<boolean> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      
      // Note: Cloudflare KV doesn't have a direct "clear" operation
      // This implementation is limited and will only delete up to 1000 keys
      // In a real application, you'd need pagination for large datasets
      const keys = await DEXTRACT_KV.list({ prefix: `${namespace}:` });
      
      const deletions = keys.keys.map(key => DEXTRACT_KV.delete(key.name));
      await Promise.all(deletions);
      
      return true;
    } catch (error) {
      this.logger.error(`Error clearing namespace: ${error.message}`);
      return false;
    }
  }

  private getFullKey(key: string, namespace: string): string {
    return `${namespace}:${key}`;
  }
}

// We need to declare the KV namespace that will be bound by Cloudflare Workers
declare global {
  const DEXTRACT_KV: KVNamespace;
}