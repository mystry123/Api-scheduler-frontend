import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  Globe,
  Shield,
  Zap,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { runsService, type Run } from "~/data/services";
import {
  formatRelativeTime,
  formatLatency,
  formatBytes,
  cn,
} from "~/lib/utils";
import {
  StatusBadge,
  MethodBadge,
  ErrorTypeBadge,
} from "~/components/ui/status-badge";

export const meta: MetaFunction<typeof loader> = ({ params }) => {
  return [{ title: `Run ${params.runId} - API Scheduler` }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { runId } = params;

  if (!runId) {
    throw new Response("Run ID is required", { status: 400 });
  }

  try {
    const run = await runsService.getRun(runId);
    return json({ run, error: null });
  } catch (error) {
    return json({
      run: null,
      error: error instanceof Error ? error.message : "Failed to load run",
    });
  }
}

export default function RunDetailPage() {
  const { run, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-medium">Failed to load run</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link to="/runs">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Runs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">Run not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The run you're looking for doesn't exist.
          </p>
          <Link to="/runs">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Runs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = run.status === "success";
  const isFailed = run.status === "failed";

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/runs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Runs
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Run Details</h1>
          <p className="text-muted-foreground">
            Execution information for run ID: {run.id}
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={run.status} />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatRelativeTime(run.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">ID: {run.id}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Request Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Method
              </label>
              <div className="mt-1">
                <MethodBadge method={run.request_method} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                URL
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm break-all">
                  {run.request_url}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(run.request_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {run.request_headers && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Request Headers
                </label>
                <div className="mt-1">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-32">
                    {JSON.stringify(run.request_headers, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {run.request_body && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Request Body
                </label>
                <div className="mt-1">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-32">
                    {typeof run.request_body === "string"
                      ? run.request_body
                      : JSON.stringify(run.request_body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Response Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {run.status_code ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status Code
                </label>
                <div className="mt-1">
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
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status Code
                </label>
                <div className="mt-1">
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Response Size
              </label>
              <div className="mt-1">
                <span className="font-mono text-sm">
                  {formatBytes(run.response_size)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Latency
              </label>
              <div className="mt-1">
                <span className="font-mono text-sm">
                  {formatLatency(run.latency_ms)}
                </span>
              </div>
            </div>

            {run.response_headers && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Response Headers
                </label>
                <div className="mt-1">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-32">
                    {JSON.stringify(run.response_headers, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {run.response_body && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Response Body
                </label>
                <div className="mt-1">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-32">
                    {typeof run.response_body === "string"
                      ? run.response_body
                      : JSON.stringify(run.response_body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Information */}
      {isFailed && (
        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Error Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {run.error_type && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Error Type
                </label>
                <div className="mt-1">
                  <ErrorTypeBadge errorType={run.error_type} />
                </div>
              </div>
            )}

            {run.error_message && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Error Message
                </label>
                <div className="mt-1">
                  <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-md">
                    {run.error_message}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created At
              </label>
              <div className="mt-1">
                <span className="font-mono text-sm">
                  {new Date(run.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {run.started_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Started At
                </label>
                <div className="mt-1">
                  <span className="font-mono text-sm">
                    {new Date(run.started_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {run.completed_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Completed At
                </label>
                <div className="mt-1">
                  <span className="font-mono text-sm">
                    {new Date(run.completed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Duration
              </label>
              <div className="mt-1">
                <span className="font-mono text-sm">
                  {formatLatency(run.latency_ms)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
