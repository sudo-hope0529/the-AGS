import { supabase } from '../supabase';
import { Configuration, OpenAIApi } from 'openai';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  resourceLoadTimes: Record<string, number>;
  memoryUsage: number;
  networkRequests: number;
}

interface DeviceInfo {
  deviceType: string;
  connection: string;
  memory: number;
  cpu: number;
  gpu: string | null;
}

interface OptimizationStrategy {
  preloadResources: string[];
  lazyLoadComponents: string[];
  imageSizes: Record<string, { width: number; height: number }>;
  cacheStrategy: 'network-first' | 'cache-first' | 'stale-while-revalidate';
  compressionLevel: number;
}

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export class AIPerformanceOptimizer {
  private static instance: AIPerformanceOptimizer;
  private performanceData: PerformanceMetrics[] = [];
  private deviceInfo: DeviceInfo | null = null;
  private optimizationStrategy: OptimizationStrategy | null = null;

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  static getInstance(): AIPerformanceOptimizer {
    if (!AIPerformanceOptimizer.instance) {
      AIPerformanceOptimizer.instance = new AIPerformanceOptimizer();
    }
    return AIPerformanceOptimizer.instance;
  }

  private async initializePerformanceMonitoring() {
    // Initialize Performance Observer
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largestContentfulPaint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordMetric('firstInputDelay', entry.duration);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Monitor Layout Shifts
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordMetric('cumulativeLayoutShift', (entry as any).value);
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Monitor Resource Timing
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordResourceTiming(entry);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }

    // Get device information
    await this.gatherDeviceInfo();
  }

  private async gatherDeviceInfo() {
    this.deviceInfo = {
      deviceType: this.getDeviceType(),
      connection: this.getConnectionType(),
      memory: (navigator as any).deviceMemory || 4,
      cpu: navigator.hardwareConcurrency || 4,
      gpu: await this.getGPUInfo()
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getConnectionType(): string {
    const conn = (navigator as any).connection;
    return conn ? conn.effectiveType : '4g';
  }

  private async getGPUInfo(): Promise<string | null> {
    if ('gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        return adapter?.name || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private recordMetric(name: keyof PerformanceMetrics, value: number) {
    const metrics = this.performanceData[this.performanceData.length - 1] || {};
    metrics[name] = value;
    this.performanceData[this.performanceData.length - 1] = metrics as PerformanceMetrics;

    // Analyze and optimize if we have enough data
    if (this.performanceData.length >= 5) {
      this.analyzeAndOptimize();
    }
  }

  private recordResourceTiming(entry: PerformanceEntry) {
    const metrics = this.performanceData[this.performanceData.length - 1] || {};
    if (!metrics.resourceLoadTimes) {
      metrics.resourceLoadTimes = {};
    }
    metrics.resourceLoadTimes[entry.name] = entry.duration;
    this.performanceData[this.performanceData.length - 1] = metrics as PerformanceMetrics;
  }

  private async analyzeAndOptimize() {
    try {
      // Generate optimization suggestions using AI
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a performance optimization expert. Analyze the performance metrics and suggest optimizations."
          },
          {
            role: "user",
            content: `
              Performance Data: ${JSON.stringify(this.performanceData)}
              Device Info: ${JSON.stringify(this.deviceInfo)}
              Current Strategy: ${JSON.stringify(this.optimizationStrategy)}
            `
          }
        ],
      });

      const suggestions = JSON.parse(response.data.choices[0].message?.content || "{}");
      await this.applyOptimizations(suggestions);
    } catch (error) {
      console.error('Error analyzing performance:', error);
    }
  }

  private async applyOptimizations(suggestions: any) {
    // Update optimization strategy
    this.optimizationStrategy = {
      preloadResources: suggestions.preloadResources || [],
      lazyLoadComponents: suggestions.lazyLoadComponents || [],
      imageSizes: suggestions.imageSizes || {},
      cacheStrategy: suggestions.cacheStrategy || 'network-first',
      compressionLevel: suggestions.compressionLevel || 1
    };

    // Apply preloading
    this.optimizationStrategy.preloadResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = this.getResourceType(resource);
      document.head.appendChild(link);
    });

    // Update service worker cache strategy
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'UPDATE_CACHE_STRATEGY',
        strategy: this.optimizationStrategy.cacheStrategy
      });
    }

    // Store optimization results
    await this.storeOptimizationResults();
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'script';
      case 'css': return 'style';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf': return 'font';
      default: return 'fetch';
    }
  }

  private async storeOptimizationResults() {
    try {
      await supabase
        .from('performance_optimizations')
        .insert([{
          device_info: this.deviceInfo,
          performance_data: this.performanceData,
          optimization_strategy: this.optimizationStrategy,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error storing optimization results:', error);
    }
  }

  // Public methods
  public async optimizeImage(url: string, width: number, height: number): Promise<string> {
    const strategy = this.optimizationStrategy;
    if (!strategy) return url;

    const sizes = strategy.imageSizes[url];
    if (!sizes) return url;

    // Apply image optimization based on device and network conditions
    const optimizedUrl = new URL(url);
    optimizedUrl.searchParams.set('w', sizes.width.toString());
    optimizedUrl.searchParams.set('q', this.calculateImageQuality().toString());
    optimizedUrl.searchParams.set('fm', this.selectImageFormat());

    return optimizedUrl.toString();
  }

  private calculateImageQuality(): number {
    const connection = this.getConnectionType();
    switch (connection) {
      case 'slow-2g':
      case '2g': return 60;
      case '3g': return 75;
      default: return 85;
    }
  }

  private selectImageFormat(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Safari') && !ua.includes('Chrome')) {
      return 'jpg'; // Safari has good JPEG performance
    }
    return 'webp'; // Default to WebP for better compression
  }

  public async preloadCriticalResources(resources: string[]) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = this.getResourceType(resource);
      document.head.appendChild(link);
    });
  }

  public enableAutoOptimization() {
    // Start continuous monitoring and optimization
    setInterval(() => {
      this.analyzeAndOptimize();
    }, 60000); // Every minute
  }
}
