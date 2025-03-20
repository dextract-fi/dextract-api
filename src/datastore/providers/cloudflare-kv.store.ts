import { KVNamespace } from '@cloudflare/workers-types';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataStore, DataStoreOptions, DataStoreValue } from '@common/types/datastore.types';

@Injectable()
export class CloudflareKVStore implements DataStore {
  private readonly logger = new Logger(CloudflareKVStore.name);
  private readonly DEFAULT_NAMESPACE = 'default';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly debug: boolean;
  
  constructor(private readonly configService: ConfigService) {
    this.debug = this.configService.get<boolean>('app.debug', false);
    this.logger.log('Initializing Cloudflare KV store');
    
    if (this.debug) {
      this.logger.debug('Debug mode enabled for Cloudflare KV store');
    }
  }

  async get<T = any>(key: string, options?: DataStoreOptions): Promise<T | null> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      const fullKey = this.getFullKey(key, namespace);
      
      if (this.debug) {
        this.logger.debug(`Getting value for key: ${fullKey}`);
      }
      
      // Access KV through the Cloudflare Workers KV namespace
      const value = await DEXTRACT_KV.get(fullKey, 'json');
      
      if (!value) {
        if (this.debug) {
          this.logger.debug(`No value found for key: ${fullKey}`);
        }
        return null;
      }
      
      const typedValue = value as DataStoreValue<T>;
      
      // Check if value has expired
      if (typedValue.expiresAt && typedValue.expiresAt < Date.now()) {
        if (this.debug) {
          this.logger.debug(`Value for key ${fullKey} has expired`);
        }
        await this.delete(key, options);
        return null;
      }
      
      if (this.debug) {
        this.logger.debug(`Retrieved value for key: ${fullKey}`);
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
      
      if (this.debug) {
        this.logger.debug(`Setting value for key: ${fullKey}`);
        if (ttl) {
          this.logger.debug(`TTL set to ${ttl}ms (${Math.ceil(ttl / 1000)}s)`);
        }
      }
      
      const storeValue: DataStoreValue<T> = {
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
      };
      
      // Set the value in KV store with explicit TTL for Cloudflare's expiration
      const kvOptions = ttl ? { expirationTtl: Math.ceil(ttl / 1000) } : undefined;
      await DEXTRACT_KV.put(fullKey, JSON.stringify(storeValue), kvOptions);
      
      if (this.debug) {
        this.logger.debug(`Successfully set value for key: ${fullKey}`);
      }
      
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
      
      if (this.debug) {
        this.logger.debug(`Deleting key: ${fullKey}`);
      }
      
      await DEXTRACT_KV.delete(fullKey);
      
      if (this.debug) {
        this.logger.debug(`Successfully deleted key: ${fullKey}`);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error.message}`);
      return false;
    }
  }

  async has(key: string, options?: DataStoreOptions): Promise<boolean> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      const fullKey = this.getFullKey(key, namespace);
      
      if (this.debug) {
        this.logger.debug(`Checking if key exists: ${fullKey}`);
      }
      
      const value = await this.get(key, options);
      const exists = value !== null;
      
      if (this.debug) {
        this.logger.debug(`Key ${fullKey} exists: ${exists}`);
      }
      
      return exists;
    } catch (error) {
      this.logger.error(`Error checking key ${key}: ${error.message}`);
      return false;
    }
  }

  async clear(options?: DataStoreOptions): Promise<boolean> {
    try {
      const namespace = options?.namespace || this.DEFAULT_NAMESPACE;
      
      if (this.debug) {
        this.logger.debug(`Clearing namespace: ${namespace}`);
      }
      
      // Note: Cloudflare KV doesn't have a direct "clear" operation
      // This implementation is limited and will only delete up to 1000 keys
      // In a real application, you'd need pagination for large datasets
      const keys = await DEXTRACT_KV.list({ prefix: `${namespace}:` });
      
      if (this.debug) {
        this.logger.debug(`Found ${keys.keys.length} keys to delete in namespace: ${namespace}`);
      }
      
      const deletions = keys.keys.map(key => DEXTRACT_KV.delete(key.name));
      await Promise.all(deletions);
      
      if (this.debug) {
        this.logger.debug(`Successfully cleared namespace: ${namespace}`);
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

// We need to declare the KV namespace that will be bound by Cloudflare Workers
declare global {
  const DEXTRACT_KV: KVNamespace;
}