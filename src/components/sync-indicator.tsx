"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Cloud } from "lucide-react";
import { useTodoStore } from "@/store/todo-store";
import { api } from "@/trpc/react";

export const SyncIndicator = () => {
  const {
    autoSyncEnabled,
    syncStatus,
    setSyncStatus,
    deviceId,
    generateDeviceId,
    todos,
    completeMode,
    lastSyncTimestamp,
    setLastSyncTimestamp,
  } = useTodoStore();

  // tRPC hooks
  const { data: syncData, refetch: refetchSyncStatus } =
    api.sync.getLatestBackup.useQuery(undefined, { enabled: autoSyncEnabled });

  const pushChangesMutation = api.sync.pushChanges.useMutation({
    onSuccess: () => {
      setSyncStatus("idle");
      setLastSyncTimestamp(new Date().toISOString());
      void refetchSyncStatus();
    },
    onError: () => {
      setSyncStatus("error");
    },
  });

  // Check if there are newer backups than our last sync
  const hasNewData =
    syncData?.latestBackup && lastSyncTimestamp
      ? new Date(syncData.latestBackup.createdAt) > new Date(lastSyncTimestamp)
      : syncData?.latestBackup !== null;

  // Generate device ID on mount
  useEffect(() => {
    if (!deviceId) {
      generateDeviceId();
    }
  }, [deviceId, generateDeviceId]);

  const handleSync = async () => {
    if (!deviceId || !autoSyncEnabled) return;

    setSyncStatus("syncing");
    try {
      await pushChangesMutation.mutateAsync({
        todos,
        completeMode,
        deviceId,
        syncVersion: 1,
      });
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus("error");
    }
  };

  if (!autoSyncEnabled) return null;

  return (
    <div className="flex items-center gap-2">
      {syncStatus === "syncing" && (
        <div className="flex items-center gap-1 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing...
        </div>
      )}
      {syncStatus === "error" && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <Cloud className="h-4 w-4" />
          Sync Error
        </div>
      )}
      {hasNewData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          className="flex items-center gap-1"
          disabled={pushChangesMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" />
          Sync Now
        </Button>
      )}
      {!hasNewData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          className="flex items-center gap-1"
          disabled={pushChangesMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" />
          Upload
        </Button>
      )}
    </div>
  );
};
