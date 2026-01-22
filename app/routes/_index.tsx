import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import {
  Target,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { metricsService, type SystemMetrics } from "~/data/services";
import { cn, formatLatency } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard - API Scheduler" },
    { name: "description", content: "API Scheduler Dashboard" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const metrics = await metricsService.getMetrics();
    return json({ metrics, error: null });
  } catch (error) {
    return json({
      metrics: null,
      error: error instanceof Error ? error.message : "Failed to load metrics",
    });
  }
}

export default function Dashboard() {
  const { metrics, error } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 5000);
    return () => clearInterval(interval);
  }, [revalidator]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-medium">Failed to load dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your scheduled API requests in real-time
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Targets"
          value={metrics.targets_count}
          icon={Target}
          description="Configured endpoints"
        />
        <MetricCard
          title="Active Schedules"
          value={metrics.schedules.active}
          icon={Calendar}
          description={`${metrics.schedules.paused} paused`}
          highlight
        />
        <MetricCard
          title="Total Runs"
          value={metrics.runs.total}
          icon={Activity}
          description={`${metrics.runs.running} running`}
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.performance.success_rate}%`}
          icon={TrendingUp}
          description="All time"
          trend={metrics.performance.success_rate >= 95 ? "up" : "down"}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Schedule Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Schedule Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatRow
                label="Active"
                value={metrics.schedules.active}
                color="emerald"
              />
              <StatRow
                label="Paused"
                value={metrics.schedules.paused}
                color="amber"
              />
              <StatRow
                label="Expired"
                value={metrics.schedules.expired}
                color="slate"
              />
            </div>
          </CardContent>
        </Card>

        {/* Run Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Run Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatRow
                label="Success"
                value={metrics.runs.success}
                color="emerald"
              />
              <StatRow
                label="Failed"
                value={metrics.runs.failed}
                color="rose"
              />
              <StatRow
                label="Pending"
                value={metrics.runs.pending}
                color="slate"
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Latency
                </span>
                <span className="font-mono text-sm">
                  {formatLatency(metrics.performance.avg_latency_ms)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Min Latency
                </span>
                <span className="font-mono text-sm">
                  {formatLatency(metrics.performance.min_latency_ms)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Max Latency
                </span>
                <span className="font-mono text-sm">
                  {formatLatency(metrics.performance.max_latency_ms)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Error Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ErrorStat label="Timeout" value={metrics.errors.timeout} />
            <ErrorStat label="DNS Error" value={metrics.errors.dns_error} />
            <ErrorStat
              label="Connection"
              value={metrics.errors.connection_error}
            />
            <ErrorStat label="SSL Error" value={metrics.errors.ssl_error} />
            <ErrorStat label="HTTP 4xx" value={metrics.errors.http_4xx} />
            <ErrorStat label="HTTP 5xx" value={metrics.errors.http_5xx} />
            <ErrorStat label="Unknown" value={metrics.errors.unknown} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Components
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: typeof Target;
  description: string;
  highlight?: boolean;
  trend?: "up" | "down";
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  highlight,
  trend,
}: MetricCardProps) {
  return (
    <Card className={highlight ? "border-primary/20 bg-primary/5" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs",
                trend === "up" ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {trend === "up" ? "↑" : "↓"}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  color: "emerald" | "amber" | "rose" | "slate" | "sky";
}

function StatRow({ label, value, color }: StatRowProps) {
  const colorClasses = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
    sky: "bg-sky-500",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", colorClasses[color])} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

function ErrorStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-sm", value > 0 && "text-rose-600")}>
        {value}
      </span>
    </div>
  );
}
