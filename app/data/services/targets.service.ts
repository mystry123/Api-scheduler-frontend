import { getAxiosInstance } from "~/data/axios/axiosInstances";

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
  total_runs?: number;
  successful_runs?: number;
  failed_runs?: number;
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

export interface PaginatedTargetResponse {
  items: Target[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Targets Service
class TargetsService {
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

  async getTargets(page = 1, pageSize = 20): Promise<PaginatedTargetResponse> {
    return this.request<PaginatedTargetResponse>(
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
}

export const targetsService = new TargetsService();
