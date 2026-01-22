import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Play,
  Clock,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MethodBadge } from "~/components/ui/status-badge";
import { targetsService, type Target } from "~/data/services";
import { formatRelativeTime } from "~/lib/utils";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `${data?.target?.name || "Target"} - API Scheduler` }];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { targetId } = params;

  if (!targetId) {
    throw new Response("Target ID is required", { status: 400 });
  }

  try {
    const target = await targetsService.getTarget(targetId);

    if (!target) {
      throw new Response("Target not found", { status: 404 });
    }

    return json({ target, error: null });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    return json({
      target: null,
      error: error instanceof Error ? error.message : "Failed to load target",
    });
  }
}

export default function TargetDetailPage() {
  const { target, error } = useLoaderData<typeof loader>();

  console.log("target", target);
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/targets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Targets
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-medium text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/targets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Targets
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">Target Not Found</h2>
          <p className="text-muted-foreground">
            The target you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/targets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Targets
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight">
              {target.name}
            </h1>
            <p className="text-muted-foreground">
              HTTP endpoint configuration details
            </p>
          </div>
        </div>
      </div>

      {/* Target Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="font-medium">{target.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Method
              </label>
              <div className="flex items-center gap-2">
                <MethodBadge method={target.method} />
                <span className="font-mono text-sm">{target.method}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                URL
              </label>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {target.url}
                </a>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Timeout
              </label>
              <p className="font-medium">{target.timeout_seconds} seconds</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatRelativeTime(target.created_at)}</span>
              </div>
            </div>

            {target.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-sm">{target.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Request Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {target.headers && Object.keys(target.headers).length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Headers
                </label>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(target.headers, null, 2)}
                </pre>
              </div>
            )}

            {target.body && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Body
                </label>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {target.body}
                </pre>
              </div>
            )}

            {!target.headers && !target.body && (
              <p className="text-sm text-muted-foreground italic">
                No custom headers or body configured
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {target.schedule_count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Schedules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{target.total_runs || 0}</div>
              <div className="text-sm text-muted-foreground">Total Runs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {target.successful_runs || 0}
              </div>
              <div className="text-sm text-muted-foreground">Successes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {target.failed_runs || 0}
              </div>
              <div className="text-sm text-muted-foreground">Failures</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
