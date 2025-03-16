export interface DataStoreValue<T = any> {
    value: T;
    expiresAt?: number;
  }
  
  export interface DataStoreOptions {
    ttl?: number; // Time to live in milliseconds
    namespace?: string;
  }
  
  export interface DataStore {
    get<T = any>(key: string, options?: DataStoreOptions): Promise<T | null>;
    set<T = any>(key: string, value: T, options?: DataStoreOptions): Promise<boolean>;
    delete(key: string, options?: DataStoreOptions): Promise<boolean>;
    has(key: string, options?: DataStoreOptions): Promise<boolean>;
    clear(options?: DataStoreOptions): Promise<boolean>;
  }