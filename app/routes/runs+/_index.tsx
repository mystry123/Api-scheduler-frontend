import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  useLoaderData,
  useSearchParams,
  useRevalidator,
  Link,
  useNavigate,
} from "@remix-run/react";
import { useEffect } from "react";
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EmptyState } from "~/components/ui/empty-state";
import {
  StatusBadge,
  MethodBadge,
  ErrorTypeBadge,
} from "~/components/ui/status-badge";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { runsService, type Run } from "~/data/services";
import {
  formatRelativeTime,
  formatLatency,
  formatBytes,
  cn,
} from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: "Runs - API Scheduler" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("page_size") || "10");
  const status = url.searchParams.get("status");
  const errorType = url.searchParams.get("error_type");

  try {
    const runs = await runsService.getRuns(page, pageSize, {
      status: status || undefined,
      error_type: errorType || undefined,
    });
    return json({ runs, error: null });
  } catch (error) {
    return json({
      runs: {
        items: [],
        total: 0,
        page: 1,
        page_size: pageSize,
        total_pages: 0,
      },
      error: error instanceof Error ? error.message : "Failed to load runs",
    });
  }
}

export default function RunsPage() {
  const { runs, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();

  const statusFilter = searchParams.get("status") || "all";
  const errorTypeFilter = searchParams.get("error_type") || "all";
  const pageSize = parseInt(searchParams.get("page_size") || "10");

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 3000);
    return () => clearInterval(interval);
  }, [revalidator]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const updatePageSize = (newPageSize: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page_size", newPageSize);
    newParams.delete("page"); // Reset to first page when changing page size
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = statusFilter !== "all" || errorTypeFilter !== "all";

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Runs</h1>
        <p className="text-muted-foreground">
          Monitor execution history and results
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-500" />
          <Select
            value={statusFilter}
            onValueChange={(v) => updateFilter("status", v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={errorTypeFilter}
            onValueChange={(v) => updateFilter("error_type", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Error Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Errors</SelectItem>
              <SelectItem value="timeout">Timeout</SelectItem>
              <SelectItem value="dns_error">DNS Error</SelectItem>
              <SelectItem value="connection_error">Connection</SelectItem>
              <SelectItem value="ssl_error">SSL Error</SelectItem>
              <SelectItem value="http_4xx">HTTP 4xx</SelectItem>
              <SelectItem value="http_5xx">HTTP 5xx</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={updatePageSize}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{runs.total} runs</Badge>
        </div>
      </div>

      {/* Runs List */}
      {runs.items.length === 0 ? (
        <EmptyState
          icon={Activity}
          iconClassName="text-slate-400"
          title="No runs found"
          description={
            hasFilters
              ? "No runs match your filter criteria"
              : "Runs will appear here when your schedules execute"
          }
        />
      ) : (
        <div className="space-y-2">
          {/* Header Row */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Endpoint</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Response</div>
            <div className="col-span-2">Latency</div>
            <div className="col-span-3">Time</div>
          </div>

          {/* Run Rows */}
          {runs.items.map((run) => (
            <RunRow key={run?.id} run={run!} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {runs.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={runs.page <= 1}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("page", String(runs.page - 1));
              setSearchParams(newParams);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {runs.page} of {runs.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={runs.page >= runs.total_pages}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("page", String(runs.page + 1));
              setSearchParams(newParams);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function RunRow({ run }: { run: Run }) {
  const isFailed = run.status === "failed";

  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "transition-colors cursor-pointer",
        isFailed && "border-rose-200 dark:border-rose-900/50",
      )}
      onClick={() => {
        navigate(`${run.id}`);
      }}
    >
      <CardContent className="p-4">
        <div className="grid md:grid-cols-12 gap-4 items-center">
          {/* Endpoint */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <MethodBadge method={run.request_method} />
              <span className="font-mono text-xs truncate max-w-[200px]">
                {new URL(run.request_url).pathname}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {run.request_url}
            </p>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <StatusBadge status={run.status} />
          </div>

          {/* Response */}
          <div className="md:col-span-2">
            {run.status_code ? (
              <div className="space-y-1">
                <Badge
                  variant={
                    run.status_code < 300
                      ? "success"
                      : run.status_code < 400
                        ? "warning"
                        : "error"
                  }
                >
                  {run.status_code}
                </Badge>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>

          {/* Latency */}
          <div className="md:col-span-2">
            <span className="font-mono text-sm">
              {formatLatency(run.latency_ms)}
            </span>
          </div>

          {/* Time */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3 text-blue-500" />
              <span>{formatRelativeTime(run.created_at)}</span>
            </div>
            {run.error_message && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 line-clamp-1">
                {run.error_message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
