import axios, { AxiosError, AxiosRequestConfig } from 'axios'

interface RetryConfig {
  maxRetries?: number
  retryDelay?: number
  shouldRetry?: (error: AxiosError) => boolean
}

interface CacheConfig {
  ttl?: number
  key?: string
}

interface RequestConfig extends AxiosRequestConfig {
  retry?: RetryConfig
  cache?: CacheConfig
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  shouldRetry: (error: AxiosError) => {
    const status = error.response?.status
    return !status || status >= 500 || status === 429
  },
}

const cache = new Map<string, { data: any; timestamp: number }>()

export class APIClient {
  private static instance: APIClient
  private baseURL: string

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient()
    }
    return APIClient.instance
  }

  private getCacheKey(config: RequestConfig): string {
    if (config.cache?.key) return config.cache.key
    return `${config.method || 'GET'}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`
  }

  private isCacheValid(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp < ttl
  }

  private async retryRequest(
    config: RequestConfig,
    retryCount: number = 0
  ): Promise<any> {
    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retry,
    }

    try {
      const response = await axios({
        ...config,
        baseURL: this.baseURL,
      })
      return response.data
    } catch (error) {
      if (
        error instanceof AxiosError &&
        retryCount < retryConfig.maxRetries &&
        retryConfig.shouldRetry(error)
      ) {
        await new Promise(resolve =>
          setTimeout(resolve, retryConfig.retryDelay * Math.pow(2, retryCount))
        )
        return this.retryRequest(config, retryCount + 1)
      }
      throw error
    }
  }

  public async request<T>(config: RequestConfig): Promise<T> {
    // Check cache if configured
    if (config.cache) {
      const cacheKey = this.getCacheKey(config)
      const cached = cache.get(cacheKey)
      
      if (
        cached &&
        this.isCacheValid(cached.timestamp, config.cache.ttl || 5 * 60 * 1000)
      ) {
        return cached.data
      }
    }

    const data = await this.retryRequest(config)

    // Update cache if configured
    if (config.cache) {
      const cacheKey = this.getCacheKey(config)
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })
    }

    return data
  }

  public async get<T>(
    url: string,
    config: Omit<RequestConfig, 'method' | 'url'> = {}
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
    })
  }

  public async post<T>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'url' | 'data'> = {}
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    })
  }

  public async put<T>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'url' | 'data'> = {}
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    })
  }

  public async delete<T>(
    url: string,
    config: Omit<RequestConfig, 'method' | 'url'> = {}
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
    })
  }

  public clearCache(): void {
    cache.clear()
  }

  public removeCacheItem(key: string): void {
    cache.delete(key)
  }
}

export const api = APIClient.getInstance()

// Export common types
export type { RequestConfig, RetryConfig, CacheConfig }
