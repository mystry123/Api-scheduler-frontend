import { Badge } from "~/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  AlertCircle,
  Loader2,
} from "lucide-react";

type ScheduleStatus = "active" | "paused" | "expired" | "deleted";
type RunStatus = "pending" | "running" | "success" | "failed";

interface StatusBadgeProps {
  status: ScheduleStatus | RunStatus;
  showIcon?: boolean;
}

const scheduleStatusConfig: Record<
  ScheduleStatus,
  { label: string; variant: "success" | "warning" | "muted" | "error"; icon: typeof Play }
> = {
  active: { label: "Active", variant: "success", icon: Play },
  paused: { label: "Paused", variant: "warning", icon: Pause },
  expired: { label: "Expired", variant: "muted", icon: Clock },
  deleted: { label: "Deleted", variant: "muted", icon: XCircle },
};

const runStatusConfig: Record<
  RunStatus,
  { label: string; variant: "success" | "warning" | "muted" | "error" | "info"; icon: typeof CheckCircle2 }
> = {
  pending: { label: "Pending", variant: "muted", icon: Clock },
  running: { label: "Running", variant: "info", icon: Loader2 },
  success: { label: "Success", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "error", icon: XCircle },
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config =
    status in scheduleStatusConfig
      ? scheduleStatusConfig[status as ScheduleStatus]
      : runStatusConfig[status as RunStatus];

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      {showIcon && (
        <Icon
          className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`}
        />
      )}
      {config.label}
    </Badge>
  );
}

interface MethodBadgeProps {
  method: string;
}

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  POST: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PATCH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  HEAD: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  OPTIONS: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export function MethodBadge({ method }: MethodBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        methodColors[method] || methodColors.GET
      }`}
    >
      {method}
    </span>
  );
}

interface ErrorTypeBadgeProps {
  errorType: string;
}

export function ErrorTypeBadge({ errorType }: ErrorTypeBadgeProps) {
  const variant = errorType === "success" ? "success" : "error";
  
  return (
    <Badge variant={variant} className="gap-1">
      {errorType === "success" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {errorType.replace(/_/g, " ")}
    </Badge>
  );
}
