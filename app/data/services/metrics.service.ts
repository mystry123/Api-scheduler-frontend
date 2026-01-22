import { getAxiosInstance } from "~/data/axios/axiosInstances";

// Types
export interface SystemMetrics {
  timestamp: string;
  targets_count: number;
  schedules: {
    total: number;
    active: number;
    paused: number;
    expired: number;
  };
  runs: {
    total: number;
    success: number;
    failed: number;
    pending: number;
    running: number;
  };
  errors: {
    timeout: number;
    dns_error: number;
    connection_error: number;
    ssl_error: number;
    http_4xx: number;
    http_5xx: number;
    unknown: number;
  };
  performance: {
    avg_latency_ms: number | null;
    min_latency_ms: number | null;
    max_latency_ms: number | null;
    success_rate: number;
  };
}

export interface HealthResponse {
  status: string;
  database: string;
  scheduler: string;
  timestamp: string;
}

// Metrics Service
class MetricsService {
  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.request({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body,
      headers: options.headers,
    });

    return response.data;
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  async getMetrics(): Promise<SystemMetrics> {
    return this.request<SystemMetrics>("/metrics");
  }
}

export const metricsService = new MetricsService();
