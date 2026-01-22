import { getAxiosInstance } from "~/data/axios/axiosInstances";
import { Target } from "./targets.service";

// Types
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

export interface PaginatedScheduleResponse {
  items: Schedule[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Schedules Service
class SchedulesService {
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

  async getSchedules(
    page = 1,
    pageSize = 20,
    filters?: { status?: string; target_id?: string }
  ): Promise<PaginatedScheduleResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters?.status) params.append("status", filters.status);
    if (filters?.target_id) params.append("target_id", filters.target_id);

    return this.request<PaginatedScheduleResponse>(`/schedules?${params}`);
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
}

export const schedulesService = new SchedulesService();
