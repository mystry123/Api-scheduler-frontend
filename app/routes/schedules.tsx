import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  useLoaderData,
  useNavigation,
  useSubmit,
  Form,
  Link,
  useSearchParams,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { EmptyState } from "~/components/ui/empty-state";
import { StatusBadge } from "~/components/ui/status-badge";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  schedulesService,
  targetsService,
  type Schedule,
  type Target,
  type ScheduleCreate,
} from "~/data/services";
import { formatRelativeTime, formatDuration } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: "Schedules - API Scheduler" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("page_size") || "20");
  const status = url.searchParams.get("status") || undefined;

  try {
    const [schedules, targets] = await Promise.all([
      schedulesService.getSchedules(page, pageSize, {
        status,
      }),
      targetsService.getTargets(1, 100), // Get all targets for the dropdown
    ]);
    return json({ schedules, targets, error: null });
  } catch (error) {
    return json({
      schedules: {
        items: [],
        total: 0,
        page: 1,
        page_size: pageSize,
        total_pages: 0,
      },
      targets: {
        items: [],
        total: 0,
        page: 1,
        page_size: 100,
        total_pages: 0,
      },
      error:
        error instanceof Error ? error.message : "Failed to load schedules",
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create") {
      const data: ScheduleCreate = {
        target_id: formData.get("target_id") as string,
        schedule_type: formData.get("schedule_type") as "interval" | "window",
        interval_seconds: parseInt(formData.get("interval_seconds") as string),
      };

      if (data.schedule_type === "window") {
        data.duration_seconds = parseInt(
          formData.get("duration_seconds") as string,
        );
      }

      await schedulesService.createSchedule(data);
      return json({ success: true, message: "Schedule created" });
    }

    if (intent === "pause") {
      const id = formData.get("id") as string;
      await schedulesService.pauseSchedule(id);
      return json({ success: true, message: "Schedule paused" });
    }

    if (intent === "resume") {
      const id = formData.get("id") as string;
      await schedulesService.resumeSchedule(id);
      return json({ success: true, message: "Schedule resumed" });
    }

    if (intent === "delete") {
      const id = formData.get("id") as string;
      await schedulesService.deleteSchedule(id);
      return json({ success: true, message: "Schedule deleted" });
    }

    return json({ success: false, message: "Unknown action" });
  } catch (error) {
    return json({
      success: false,
      message: error instanceof Error ? error.message : "Action failed",
    });
  }
}

export default function SchedulesPage() {
  const { schedules, targets, error } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<"interval" | "window">(
    "interval",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = parseInt(searchParams.get("page_size") || "20");

  const isSubmitting = navigation.state === "submitting";

  const updatePageSize = (newPageSize: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page_size", newPageSize);
    newParams.delete("page"); // Reset to first page when changing page size
    setSearchParams(newParams);
  };

  const filteredSchedules = schedules.items.filter((schedule) => {
    const target =
      targets.items.find((t) => t?.id === schedule?.target_id) || undefined;
    const targetName = target?.name || "";
    return targetName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Schedules</h1>
          <p className="text-muted-foreground">
            Configure when to execute your API requests
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={targets.items.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Create Schedule</DialogTitle>
              <DialogDescription>
                Set up a new schedule to automatically call your target.
              </DialogDescription>
            </DialogHeader>
            <Form method="post" onSubmit={() => setIsCreateOpen(false)}>
              <input type="hidden" name="intent" value="create" />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="target_id">Target</Label>
                  <Select name="target_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a target" />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.items.filter(Boolean).map((target) => (
                        <SelectItem key={target?.id} value={target?.id!}>
                          {target?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="schedule_type">Schedule Type</Label>
                  <Select
                    name="schedule_type"
                    defaultValue="interval"
                    onValueChange={(v) =>
                      setScheduleType(v as "interval" | "window")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interval">
                        Interval (run indefinitely)
                      </SelectItem>
                      <SelectItem value="window">
                        Window (run for duration)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="interval_seconds">Interval (seconds)</Label>
                  <Input
                    id="interval_seconds"
                    name="interval_seconds"
                    type="number"
                    min="1"
                    max="86400"
                    defaultValue="60"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to execute the request
                  </p>
                </div>

                {scheduleType === "window" && (
                  <div className="grid gap-2">
                    <Label htmlFor="duration_seconds">Duration (seconds)</Label>
                    <Input
                      id="duration_seconds"
                      name="duration_seconds"
                      type="number"
                      min="1"
                      max="604800"
                      defaultValue="300"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Total time to run before expiring
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Schedule"}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by target name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
          <Badge variant="secondary">{schedules.total} schedules</Badge>
        </div>
      </div>

      {/* Schedules List */}
      {targets.items.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No targets available"
          description="Create a target first before setting up schedules"
          action={
            <Button asChild>
              <Link to="/targets">
                <Plus className="mr-2 h-4 w-4" />
                Create Target
              </Link>
            </Button>
          }
        />
      ) : filteredSchedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No schedules found"
          description={
            searchQuery
              ? "No schedules match your search"
              : "Create your first schedule to automate API requests"
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSchedules.map((schedule) => {
            const target = targets.items.find(
              (t) => t?.id === schedule?.target_id,
            );
            return (
              <ScheduleCard
                key={schedule?.id}
                schedule={schedule!}
                target={target!}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {schedules.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={schedules.page <= 1}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("page", String(schedules.page - 1));
              setSearchParams(newParams);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {schedules.page} of {schedules.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={schedules.page >= schedules.total_pages}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("page", String(schedules.page + 1));
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

function ScheduleCard({
  schedule,
  target,
}: {
  schedule: Schedule;
  target?: Target;
}) {
  const submit = useSubmit();
  const [showDelete, setShowDelete] = useState(false);

  const handleAction = (intent: string) => {
    const formData = new FormData();
    formData.append("intent", intent);
    formData.append("id", schedule.id);
    submit(formData, { method: "post" });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main content row */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
              <RefreshCw
                className={`h-4 w-4 text-muted-foreground ${
                  schedule.is_executing ? "animate-spin" : ""
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium truncate">
                  {target?.name || "Unknown Target"}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={schedule.status} />
                  <Badge variant="secondary" className="text-xs">
                    {schedule.schedule_type}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  Every {formatDuration(schedule.interval_seconds)}
                </span>
                <span>{schedule.run_count} runs</span>
                {schedule.last_run_at && (
                  <span>
                    Last run {formatRelativeTime(schedule.last_run_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            {schedule.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("pause")}
                className="w-full sm:w-auto"
              >
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </Button>
            )}
            {schedule.status === "paused" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("resume")}
                className="w-full sm:w-auto"
              >
                <Play className="mr-1 h-3 w-3" />
                Resume
              </Button>
            )}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-auto sm:ml-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Schedule</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this schedule? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleAction("delete");
                      setShowDelete(false);
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
