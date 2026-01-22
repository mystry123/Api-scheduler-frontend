import { CONFIG } from "~/data/axios/config/config";
import { getAuthTokens } from "~/utils/cookies.client";
import axios, { AxiosInstance } from "axios";

// Types
export interface Target {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string> | null;
  body: string | null;
  timeout_seconds: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  schedule_count: number;
}

export interface TargetCreate {
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timeout_seconds?: number;
  description?: string;
}

export interface Schedule {
  id: string;
  target_id: string;
  schedule_type: "interval" | "window";
  interval_seconds: number;
  duration_seconds: number | null;
  status: "active" | "paused" | "expired" | "deleted";
  next_run_at: string;
  window_ends_at: string | null;
  is_executing: boolean;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
  target?: Target;
}

export interface ScheduleCreate {
  target_id: string;
  schedule_type: "interval" | "window";
  interval_seconds: number;
  duration_seconds?: number;
}

export interface Run {
  id: string;
  schedule_id: string;
  idempotency_key: string;
  status: "pending" | "running" | "success" | "failed";
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  status_code: number | null;
  latency_ms: number | null;
  response_size: number | null;
  error_type: string | null;
  error_message: string | null;
  request_url: string;
  request_method: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

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

// API Client using Axios configuration
class ApiClient {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || CONFIG.baseURL;
    
    // Create axios instance for client-side use
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const authTokens = getAuthTokens();
        if (authTokens?.accessToken) {
          config.headers["Authorization"] = `Bearer ${authTokens.accessToken}`;
        }
        config.headers["User-Agent"] = navigator.userAgent;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          throw new Error(
            error.response.data.detail || 
            error.response.data.message || 
            `HTTP ${error.response.status}`
          );
        }
        throw error;
      }
    );
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const response = await this.axiosInstance.request({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body,
      headers: options.headers,
    });

    return response.data;
  }

  // Health
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  // Metrics
  async getMetrics(): Promise<SystemMetrics> {
    return this.request<SystemMetrics>("/metrics");
  }

  // Targets
  async getTargets(page = 1, pageSize = 20): Promise<PaginatedResponse<Target>> {
    return this.request<PaginatedResponse<Target>>(
      `/targets?page=${page}&page_size=${pageSize}`
    );
  }

  async getTarget(id: string): Promise<Target> {
    return this.request<Target>(`/targets/${id}`);
  }

  async createTarget(data: TargetCreate): Promise<Target> {
    return this.request<Target>("/targets", {
      method: "POST",
      body: data,
    });
  }

  async updateTarget(id: string, data: Partial<TargetCreate>): Promise<Target> {
    return this.request<Target>(`/targets/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteTarget(id: string): Promise<void> {
    await this.request(`/targets/${id}`, { method: "DELETE" });
  }

  // Schedules
  async getSchedules(
    page = 1,
    pageSize = 20,
    filters?: { status?: string; target_id?: string }
  ): Promise<PaginatedResponse<Schedule>> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters?.status) params.append("status", filters.status);
    if (filters?.target_id) params.append("target_id", filters.target_id);

    return this.request<PaginatedResponse<Schedule>>(`/schedules?${params}`);
  }

  async getSchedule(id: string): Promise<Schedule> {
    return this.request<Schedule>(`/schedules/${id}`);
  }

  async createSchedule(data: ScheduleCreate): Promise<Schedule> {
    return this.request<Schedule>("/schedules", {
      method: "POST",
      body: data,
    });
  }

  async pauseSchedule(id: string): Promise<Schedule> {
    return this.request<Schedule>(`/schedules/${id}/pause`, { method: "POST" });
  }

  async resumeSchedule(id: string): Promise<Schedule> {
    return this.request<Schedule>(`/schedules/${id}/resume`, { method: "POST" });
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.request(`/schedules/${id}`, { method: "DELETE" });
  }

  // Runs
  async getRuns(
    page = 1,
    pageSize = 20,
    filters?: {
      schedule_id?: string;
      status?: string;
      error_type?: string;
    }
  ): Promise<PaginatedResponse<Run>> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters?.schedule_id) params.append("schedule_id", filters.schedule_id);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.error_type) params.append("error_type", filters.error_type);

    return this.request<PaginatedResponse<Run>>(`/runs?${params}`);
  }

  async getRun(id: string): Promise<Run> {
    return this.request<Run>(`/runs/${id}`);
  }
}

export const api = new ApiClient();
