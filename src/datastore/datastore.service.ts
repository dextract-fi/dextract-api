import { Injectable, Inject } from '@nestjs/common';
import { DataStore, DataStoreOptions } from '@common/types/datastore.types';
import { DATA_STORE } from '@datastore/datastore.constants';

@Injectable()
export class DataStoreService {
  constructor(
    @Inject(DATA_STORE) private readonly dataStore: DataStore,
  ) {}

  async get<T = any>(key: string, options?: DataStoreOptions): Promise<T | null> {
    return this.dataStore.get<T>(key, options);
  }

  async set<T = any>(key: string, value: T, options?: DataStoreOptions): Promise<boolean> {
    return this.dataStore.set<T>(key, value, options);
  }

  async delete(key: string, options?: DataStoreOptions): Promise<boolean> {
    return this.dataStore.delete(key, options);
  }

  async has(key: string, options?: DataStoreOptions): Promise<boolean> {
    return this.dataStore.has(key, options);
  }

  async clear(options?: DataStoreOptions): Promise<boolean> {
    return this.dataStore.clear(options);
  }
  
  // Cache-specific helpers
  async getOrSet<T = any>(
    key: string, 
    valueFactory: () => Promise<T>, 
    options?: DataStoreOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await valueFactory();
    await this.set(key, value, options);
    return value;
  }
}