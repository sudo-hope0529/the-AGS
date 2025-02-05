import { useEffect } from 'react'

export interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: Set<(metrics: Partial<PerformanceMetrics>) => void> = new Set()

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers() {
    // First Contentful Paint
    this.observePaint('first-contentful-paint', (entry) => {
      this.metrics.fcp = entry.startTime
      this.notifyObservers()
    })

    // Largest Contentful Paint
    this.observePaint('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime
      this.notifyObservers()
    })

    // First Input Delay
    this.observeFirstInput((entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime
      this.notifyObservers()
    })

    // Cumulative Layout Shift
    this.observeLayoutShift((entry) => {
      if (!this.metrics.cls) this.metrics.cls = 0
      this.metrics.cls += entry.value
      this.notifyObservers()
    })

    // Time to First Byte
    if (performance.getEntriesByType('navigation').length > 0) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart
      this.notifyObservers()
    }
  }

  private observePaint(type: string, callback: (entry: PerformanceEntry) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === type) {
            observer.disconnect()
            callback(entry)
            break
          }
        }
      })

      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.error(`Failed to observe ${type}:`, e)
    }
  }

  private observeFirstInput(callback: (entry: PerformanceEventTiming) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          observer.disconnect()
          callback(entry as PerformanceEventTiming)
          break
        }
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.error('Failed to observe First Input Delay:', e)
    }
  }

  private observeLayoutShift(callback: (entry: any) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry)
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.error('Failed to observe Cumulative Layout Shift:', e)
    }
  }

  private notifyObservers() {
    this.observers.forEach(observer => observer(this.metrics))
  }

  public subscribe(callback: (metrics: Partial<PerformanceMetrics>) => void) {
    this.observers.add(callback)
    callback(this.metrics) // Initial call with current metrics
    return () => this.observers.delete(callback)
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  public clearMetrics() {
    this.metrics = {}
    this.notifyObservers()
  }
}

export function usePerformanceMonitoring(
  callback?: (metrics: Partial<PerformanceMetrics>) => void
) {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance()
    
    if (callback) {
      return monitor.subscribe(callback)
    }
  }, [callback])

  return PerformanceMonitor.getInstance().getMetrics()
}

export const performanceMonitor = PerformanceMonitor.getInstance()
