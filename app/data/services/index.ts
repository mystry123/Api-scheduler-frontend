import { PaginatedRunResponse } from "./runs.service";
import { PaginatedScheduleResponse } from "./schedules.service";
import { PaginatedTargetResponse } from "./targets.service";


// Export all services
export { targetsService, type Target, type TargetCreate, type PaginatedTargetResponse } from "./targets.service";
export { metricsService, type SystemMetrics, type HealthResponse } from "./metrics.service";
export { schedulesService, type Schedule, type ScheduleCreate, type PaginatedScheduleResponse } from "./schedules.service";
export { runsService, type Run, type PaginatedRunResponse } from "./runs.service";

// Re-export common types for backward compatibility
export type PaginatedResponse<T> = 
  | PaginatedTargetResponse 
  | PaginatedScheduleResponse 
  | PaginatedRunResponse;
