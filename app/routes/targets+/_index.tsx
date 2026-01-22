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
  useActionData,
  useSearchParams,
  useNavigate,
} from "@remix-run/react";
import { useState } from "react";
import { Plus, Target, Trash2, ExternalLink, Search, Edit } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
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
import { MethodBadge } from "~/components/ui/status-badge";
import { Badge } from "~/components/ui/badge";
import {
  targetsService,
  type Target as TargetType,
  type TargetCreate,
} from "~/data/services";
import { formatRelativeTime, cn } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: "Targets - API Scheduler" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("page_size") || "20");

  try {
    const targets = await targetsService.getTargets(page, pageSize);
    return json({ targets, error: null });
  } catch (error) {
    return json({
      targets: {
        items: [],
        total: 0,
        page: 1,
        page_size: pageSize,
        total_pages: 0,
      },
      error: error instanceof Error ? error.message : "Failed to load targets",
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create") {
      const data: TargetCreate = {
        name: formData.get("name") as string,
        url: formData.get("url") as string,
        method: formData.get("method") as string,
        timeout_seconds:
          parseInt(formData.get("timeout_seconds") as string) || 30,
        description: (formData.get("description") as string) || undefined,
      };

      const headersStr = formData.get("headers") as string;
      if (headersStr) {
        try {
          data.headers = JSON.parse(headersStr);
        } catch {
          // ignore invalid JSON
        }
      }

      const body = formData.get("body") as string;
      if (body) {
        data.body = body;
      }

      await targetsService.createTarget(data);
      return json({ success: true, message: "Target created successfully" });
    }

    if (intent === "delete") {
      const id = formData.get("id") as string;
      await targetsService.deleteTarget(id);
      return json({ success: true, message: "Target deleted successfully" });
    }

    if (intent === "update") {
      const data: TargetCreate = {
        name: formData.get("name") as string,
        url: formData.get("url") as string,
        method: formData.get("method") as string,
        timeout_seconds:
          parseInt(formData.get("timeout_seconds") as string) || 30,
        description: (formData.get("description") as string) || undefined,
      };

      const headersStr = formData.get("headers") as string;
      if (headersStr) {
        try {
          data.headers = JSON.parse(headersStr);
        } catch {
          // ignore invalid JSON
        }
      }

      const body = formData.get("body") as string;
      if (body) {
        data.body = body;
      }

      const id = formData.get("id") as string;
      await targetsService.updateTarget(id, data);
      return json({ success: true, message: "Target updated successfully" });
    }

    return json({ success: false, message: "Unknown action" });
  } catch (error) {
    return json({
      success: false,
      message: error instanceof Error ? error.message : "Action failed",
    });
  }
}

export default function TargetsPage() {
  const { targets, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetType | null>(null);
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

  const openEditDialog = (target: TargetType) => {
    setEditingTarget(target);
    setIsEditOpen(true);
  };

  const filteredTargets = targets.items.filter(
    (target) =>
      target?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target?.url.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Targets</h1>
          <p className="text-muted-foreground">
            Manage your HTTP endpoint configurations
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Target
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Target</DialogTitle>
              <DialogDescription>
                Configure a new HTTP endpoint to schedule requests against.
              </DialogDescription>
            </DialogHeader>
            <Form method="post" onSubmit={() => setIsCreateOpen(false)}>
              <input type="hidden" name="intent" value="create" />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Health Check API"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://api.example.com/health"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="method">Method</Label>
                    <Select name="method" defaultValue="GET">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timeout_seconds">Timeout (s)</Label>
                    <Input
                      id="timeout_seconds"
                      name="timeout_seconds"
                      type="number"
                      min="1"
                      max="300"
                      defaultValue="30"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="headers">Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    name="headers"
                    placeholder='{"Authorization": "Bearer token"}'
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    name="body"
                    placeholder="Request body (for POST/PUT/PATCH)"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Optional description"
                  />
                </div>
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
                  {isSubmitting ? "Creating..." : "Create Target"}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or URL..."
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
          <Badge variant="secondary">{targets.total} targets</Badge>
        </div>
      </div>

      {/* Targets Grid */}
      {filteredTargets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No targets found"
          description={
            searchQuery
              ? "No targets match your search criteria"
              : "Create your first target to start scheduling API requests"
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Target
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTargets.map((target) => (
            <TargetCard
              key={target?.id}
              target={target!}
              onEdit={openEditDialog}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {targets.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={targets.page <= 1}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("page", String(targets.page - 1));
              setSearchParams(newParams);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {targets.page} of {targets.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={targets.page >= targets.total_pages}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("page", String(targets.page + 1));
              setSearchParams(newParams);
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Target</DialogTitle>
            <DialogDescription>
              Update your HTTP endpoint configuration.
            </DialogDescription>
          </DialogHeader>
          {editingTarget && (
            <Form method="post" onSubmit={() => setIsEditOpen(false)}>
              <input type="hidden" name="intent" value="update" />
              <input type="hidden" name="id" value={editingTarget.id} />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingTarget.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    type="url"
                    defaultValue={editingTarget.url}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-method">Method</Label>
                    <Select name="method" defaultValue={editingTarget.method}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-timeout_seconds">Timeout (s)</Label>
                    <Input
                      id="edit-timeout_seconds"
                      name="timeout_seconds"
                      type="number"
                      min="1"
                      max="300"
                      defaultValue={editingTarget.timeout_seconds}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-headers">Headers (JSON)</Label>
                  <Textarea
                    id="edit-headers"
                    name="headers"
                    defaultValue={
                      editingTarget.headers
                        ? JSON.stringify(editingTarget.headers, null, 2)
                        : ""
                    }
                    placeholder='{"Authorization": "Bearer token"}'
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-body">Body</Label>
                  <Textarea
                    id="edit-body"
                    name="body"
                    defaultValue={editingTarget.body || ""}
                    placeholder="Request body (for POST/PUT/PATCH)"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingTarget.description || ""}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Target"}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TargetCard({
  target,
  onEdit,
}: {
  target: TargetType;
  onEdit?: (target: TargetType) => void;
}) {
  const submit = useSubmit();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = () => {
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", target.id);
    submit(formData, { method: "post" });
    setShowDelete(false);
  };

  return (
    <Card
      className="group cursor-pointer"
      onClick={() => navigate(`${target.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              {target.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <MethodBadge method={target.method} />
              {target.schedule_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {target.schedule_count} schedule
                  {target.schedule_count !== 1 && "s"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                onClick={(e) =>  {
                  e.stopPropagation()
                  onEdit(target)}}
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Target</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{target.name}"? This action
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
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-mono text-xs">{target.url}</span>
        </div>
        {target.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {target.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Timeout: {target.timeout_seconds}s</span>
          <span>{formatRelativeTime(target.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
