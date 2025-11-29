// src/mcp/CachingMCPServer.ts
import { MCPServerDO } from '@typescript-agent-framework/mcp';

export class CachingMCPServer extends MCPServerDO<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }
  protected configureServer() {
    return {
      'cache-set': async ({ key, value, ttl }: { 
        key: string; 
        value: string;
        ttl?: number;
      }) => {
        try {
          const { CACHE } = this.env;
          
          const options: any = {};
          if (ttl) {
            options.expirationTtl = ttl;
          }
          
          await CACHE.put(key, value, options);
          
          return {
            success: true,
            key,
            cached: true,
            ttl: ttl || 'indefinite',
            cachedAt: Date.now()
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            key
          };
        }
      },
      
      'cache-get': async ({ key }: { key: string }) => {
        try {
          const { CACHE } = this.env;
          
          const value = await CACHE.get(key);
          
          return {
            success: true,
            key,
            value,
            found: !!value,
            retrievedAt: Date.now()
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            key
          };
        }
      },
      
      'cache-delete': async ({ key }: { key: string }) => {
        try {
          const { CACHE } = this.env;
          
          await CACHE.delete(key);
          
          return {
            success: true,
            key,
            deleted: true,
            deletedAt: Date.now()
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            key
          };
        }
      }
    };
  }
}

