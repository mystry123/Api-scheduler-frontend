import { getAxiosInstance } from "~/data/axios/axiosInstances";

// Types
export interface Run {
  id: string;
  schedule_id: string;
  idempotency_key: string;
  status: "pending" | "running" | "success" | "failed";
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status_code: number | null;
  latency_ms: number | null;
  response_size: number | null;
  error_type: string | null;
  error_message: string | null;
  request_url: string;
  request_method: string;
  request_headers?: Record<string, any> | null;
  request_body?: any;
  response_headers?: Record<string, any> | null;
  response_body?: any;
  created_at: string;
  updated_at: string;
}

export interface PaginatedRunResponse {
  items: Run[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Runs Service
class RunsService {
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

  async getRuns(
    page = 1,
    pageSize = 20,
    filters?: {
      schedule_id?: string;
      status?: string;
      error_type?: string;
    }
  ): Promise<PaginatedRunResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters?.schedule_id) params.append("schedule_id", filters.schedule_id);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.error_type) params.append("error_type", filters.error_type);

    return this.request<PaginatedRunResponse>(`/runs?${params}`);
  }

  async getRun(id: string): Promise<Run> {
    return this.request<Run>(`/runs/${id}`);
  }
}

export const runsService = new RunsService();
