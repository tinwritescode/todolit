"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle,
  FileText,
  Cloud,
  Clock,
  HardDrive,
} from "lucide-react";
import { useTodoStore } from "@/store/todo-store";
import { HydrationWrapper } from "@/components/hydration-wrapper";
import { api } from "@/trpc/react";
// import { UploadButton } from "@/lib/uploadthing";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { RotateCcw } from "lucide-react";

// Create typed uploader
const { uploadFiles } = genUploader<OurFileRouter>();

// Zod schemas for data validation
const TodoSchema = z.object({
  id: z.number(),
  text: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  repeatDaily: z.boolean().optional(),
  lastCompletedDate: z.string().optional(),
  completeLogs: z.array(z.string()),
});

const ImportDataSchema = z.object({
  todos: z.array(TodoSchema),
  completeMode: z.boolean().optional(),
  exportDate: z.string().optional(),
  version: z.string().optional(),
});

export default function SettingsPage() {
  const { todos, completeMode, setCompleteMode } = useTodoStore();
  const [importData, setImportData] = useState("");
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupPreview, setBackupPreview] = useState<any>(null);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);

  // tRPC hooks for backup files
  const { data: backupFiles, refetch: refetchBackups } =
    api.backupFiles.list.useQuery();
  const deleteBackupMutation = api.backupFiles.delete.useMutation({
    onSuccess: () => {
      void refetchBackups();
    },
  });
  const createBackupMutation = api.backupFiles.create.useMutation({
    onSuccess: () => {
      void refetchBackups();
    },
  });

  const handleRestoreClick = async (backupFile: any) => {
    try {
      // Fetch the backup file content
      const response = await fetch(backupFile.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch backup file: ${response.statusText}`);
      }

      const backupData = await response.json();

      // Validate the backup data
      const validatedData = ImportDataSchema.parse(backupData);

      if (validatedData.todos.length === 0) {
        throw new Error("No valid todo items found in the backup");
      }

      // Set the preview data and open dialog
      setBackupPreview(validatedData);
      setSelectedBackup(backupFile);
      setRestoreDialogOpen(true);
    } catch (error) {
      setImportStatus({
        type: "error",
        message: `Failed to load backup: ${error instanceof Error ? error.message : "Invalid backup file"}`,
      });
      void setTimeout(() => {
        setImportStatus({ type: null, message: "" });
      }, 3000);
    }
  };

  const handleConfirmRestore = () => {
    if (backupPreview) {
      // Restore the data to Zustand store
      useTodoStore.setState({
        todos: backupPreview.todos,
        completeMode: backupPreview.completeMode ?? false,
      });

      setImportStatus({
        type: "success",
        message: `Successfully restored ${backupPreview.todos.length} todos from backup`,
      });

      // Close dialog and reset state
      setRestoreDialogOpen(false);
      setBackupPreview(null);
      setSelectedBackup(null);
    }

    // Clear status after 3 seconds
    void setTimeout(() => {
      setImportStatus({ type: null, message: "" });
    }, 3000);
  };

  const exportData = () => {
    const data = {
      todos,
      completeMode,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateBackup = async () => {
    // Create the backup data from Zustand store
    const data = {
      todos,
      completeMode,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a file from the blob with timestamp
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr =
      now.toTimeString().split(" ")[0]?.replace(/:/g, "-") ?? "00-00-00";
    const file = new File([blob], `todo-backup-${dateStr}-${timeStr}.json`, {
      type: "application/json",
    });

    try {
      // Upload to UploadThing using the proper client
      const uploadedFiles = await uploadFiles("backupUploader", {
        files: [file],
        onUploadProgress: ({ file, progress }) => {
          console.log(`Uploading ${file.name}: ${progress}%`);
        },
      });

      if (uploadedFiles?.[0]) {
        const uploadedFile = uploadedFiles[0];

        // Create backup record with the uploaded file data
        const backupData = {
          name: `Todo Backup - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
          description: `Backup of ${todos.length} todos (${todos.filter((t) => t.completed).length} completed)`,
          fileName: uploadedFile.name,
          fileUrl: uploadedFile.url,
          fileKey: uploadedFile.key ?? `todo-backup-${Date.now()}`,
          fileSize: uploadedFile.size,
          mimeType: uploadedFile.type,
          version: "1.0",
          category: "todo-backup",
        };

        await createBackupMutation.mutateAsync(backupData);
        setImportStatus({
          type: "success",
          message: "Backup file uploaded and created successfully!",
        });
      } else {
        throw new Error("No file data received from upload");
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message: `Failed to upload backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Clear status after 3 seconds
    void setTimeout(() => {
      setImportStatus({ type: null, message: "" });
    }, 3000);
  };

  const handleImportData = () => {
    try {
      const parsedData = JSON.parse(importData);

      // Use Zod to validate and parse the data
      const validatedData = ImportDataSchema.parse(parsedData);

      if (validatedData.todos.length === 0) {
        throw new Error("No valid todo items found in the imported data");
      }

      // Import the data
      useTodoStore.setState({
        todos: validatedData.todos,
        completeMode: validatedData.completeMode ?? false,
      });

      setImportStatus({
        type: "success",
        message: `Successfully imported ${validatedData.todos.length} todos`,
      });

      // Clear the input
      setImportData("");

      // Clear success message after 3 seconds
      void setTimeout(() => {
        setImportStatus({ type: null, message: "" });
      }, 3000);
    } catch (error) {
      setImportStatus({
        type: "error",
        message: `Import failed: ${error instanceof Error ? error.message : "Invalid JSON format"}`,
      });

      // Clear error message after 5 seconds
      void setTimeout(() => {
        setImportStatus({ type: null, message: "" });
      }, 5000);
    }
  };

  const clearAllData = () => {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone.",
      )
    ) {
      useTodoStore.setState({
        todos: [],
        completeMode: false,
      });
      setImportStatus({
        type: "warning",
        message: "All data has been cleared",
      });

      void setTimeout(() => {
        setImportStatus({ type: null, message: "" });
      }, 3000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <HydrationWrapper>
      <div className="bg-background min-h-screen p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
              <Settings className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your todo data and preferences
            </p>
          </div>

          {/* Complete Mode Setting */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Enable click-to-complete mode for tasks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Normal</span>
                  <button
                    onClick={() => {
                      setCompleteMode(!completeMode);
                    }}
                    className={`focus:ring-ring relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                      completeMode ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`bg-background inline-block h-4 w-4 transform rounded-full transition-transform ${
                        completeMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-muted-foreground text-sm">
                    Complete
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                Export all your todos and settings to a JSON file for backup
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Data:</p>
                  <p className="text-muted-foreground text-sm">
                    {todos.length} todos •{" "}
                    {todos.filter((t) => t.completed).length} completed
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={exportData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Data Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Import todos from a previously exported JSON file
              </p>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload JSON File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="json-input">Or Paste JSON Data</Label>
                <textarea
                  id="json-input"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your JSON data here..."
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {importStatus.type && (
                <div
                  className={`flex items-center gap-2 rounded-md p-3 ${
                    importStatus.type === "success"
                      ? "border border-green-200 bg-green-50 text-green-800"
                      : importStatus.type === "error"
                        ? "border border-red-200 bg-red-50 text-red-800"
                        : "border border-yellow-200 bg-yellow-50 text-yellow-800"
                  }`}
                >
                  {importStatus.type === "success" && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {importStatus.type === "error" && (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {importStatus.type === "warning" && (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{importStatus.message}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImportData}
                  disabled={!importData.trim()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setImportData("")}
                  disabled={!importData.trim()}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Backup Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Manage your cloud backup files
                </p>
                <Button
                  onClick={handleCreateBackup}
                  disabled={createBackupMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Cloud className="h-4 w-4" />
                  {createBackupMutation.isPending
                    ? "Uploading..."
                    : "Upload Backup"}
                </Button>
              </div>

              {backupFiles && backupFiles.length > 0 ? (
                <div className="space-y-3">
                  {backupFiles.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <HardDrive className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-base leading-tight font-medium">
                              {backup.name}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {backup.fileName} •{" "}
                              {(backup.fileSize / 1024).toFixed(1)} KB
                            </p>
                            {backup.description && (
                              <p className="text-muted-foreground mt-1 text-sm">
                                {backup.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(backup.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(backup.fileUrl, "_blank")
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreClick(backup)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this backup?",
                                )
                              ) {
                                deleteBackupMutation.mutate({ id: backup.id });
                              }
                            }}
                            disabled={deleteBackupMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Cloud className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">No backup files yet</p>
                  <p className="text-muted-foreground text-sm">
                    Upload files to create your first backup
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                Permanently delete all your todos and reset settings
              </p>
              <Button
                variant="destructive"
                onClick={clearAllData}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>

          {/* Data Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{todos.length}</p>
                  <p className="text-muted-foreground text-sm">Total Todos</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">
                    {todos.filter((t) => t.completed).length}
                  </p>
                  <p className="text-muted-foreground text-sm">Completed</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">
                    {todos.filter((t) => !t.completed).length}
                  </p>
                  <p className="text-muted-foreground text-sm">Pending</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">
                    {todos.filter((t) => t.repeatDaily).length}
                  </p>
                  <p className="text-muted-foreground text-sm">Daily Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Review Backup Before Restore
            </DialogTitle>
            <DialogDescription>
              Review the backup data before restoring. This will replace your
              current todos.
            </DialogDescription>
          </DialogHeader>

          {backupPreview && selectedBackup && (
            <div className="space-y-4">
              {/* Backup Info */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Backup Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedBackup.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {new Date(selectedBackup.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Todos:</span>
                    <p className="font-medium">{backupPreview.todos.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completed:</span>
                    <p className="font-medium">
                      {
                        backupPreview.todos.filter((t: any) =>
                          Boolean(t.completed),
                        ).length
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Complete Mode:
                    </span>
                    <p className="font-medium">
                      {backupPreview.completeMode ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Export Date:</span>
                    <p className="font-medium">
                      {backupPreview.exportDate
                        ? new Date(backupPreview.exportDate).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Todo Preview */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">
                  Todo Preview (First 5 items)
                </h4>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {backupPreview.todos
                    .slice(0, 5)
                    .map((todo: any, index: number) => (
                      <div
                        key={index}
                        className="bg-muted/50 flex items-center gap-2 rounded p-2 text-sm"
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            todo.completed ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span
                          className={
                            todo.completed
                              ? "text-muted-foreground line-through"
                              : ""
                          }
                        >
                          {todo.text}
                        </span>
                      </div>
                    ))}
                  {backupPreview.todos.length > 5 && (
                    <p className="text-muted-foreground text-sm">
                      ... and {backupPreview.todos.length - 5} more todos
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setBackupPreview(null);
                setSelectedBackup(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRestore}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HydrationWrapper>
  );
}
