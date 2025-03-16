import { Injectable, Logger } from '@nestjs/common';
import { DataStore, DataStoreOptions, DataStoreValue } from '@common/types/datastore.types';

@Injectable()
export class MemoryStore implements DataStore {
  private readonly logger = new Logger(MemoryStore.name);
  private readonly DEFAULT_NAMESPACE = 'default';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  private store: Map<string, DataStoreValue> = new Map();
  
  constructor() {
    this.logger.log('Initializing Memory store');
  }

  async get<T = any>(key: string, options?: DataStoreOptions): Promise<T | null> {
    const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
    const fullKey = this.getFullKey(key, namespace);
    
    const value = this.store.get(fullKey);
    
    if (!value) {
      return null;
    }
    
    // Check if value has expired
    if (value.expiresAt && value.expiresAt < Date.now()) {
      await this.delete(key, options);
      return null;
    }
    
    return value.value as T;
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
      
      this.store.set(fullKey, storeValue);
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
      
      return this.store.delete(fullKey);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error.message}`);
      return false;
    }
  }

  async has(key: string, options?: DataStoreOptions): Promise<boolean> {
    const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
    const fullKey = this.getFullKey(key, namespace);
    
    const value = this.store.get(fullKey);
    
    if (!value) {
      return false;
    }
    
    // Check if value has expired
    if (value.expiresAt && value.expiresAt < Date.now()) {
      await this.delete(key, options);
      return false;
    }
    
    return true;
  }

  async clear(options?: DataStoreOptions): Promise<boolean> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      
      // If namespace is not specified, clear all keys in the default namespace only
      if (namespace === this.DEFAULT_NAMESPACE) {
        const keysToDelete: string[] = [];
        
        // First, identify all keys in the default namespace
        for (const key of this.store.keys()) {
          if (key.startsWith(`${namespace}:`)) {
            keysToDelete.push(key);
          }
        }
        
        // Then delete them
        for (const key of keysToDelete) {
          this.store.delete(key);
        }
      } else {
        // Clear only the specified namespace
        const prefix = `${namespace}:`;
        for (const key of this.store.keys()) {
          if (key.startsWith(prefix)) {
            this.store.delete(key);
          }
        }
      }
      
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