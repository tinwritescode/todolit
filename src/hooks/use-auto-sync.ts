import { useEffect, useCallback, useRef } from "react";
import { useTodoStore } from "@/store/todo-store";
import { api } from "@/trpc/react";

export const useAutoSync = () => {
  const {
    autoSyncEnabled,
    deviceId,
    todos,
    completeMode,
    setSyncStatus,
    setLastSyncTimestamp,
  } = useTodoStore();

  const syncTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSyncRef = useRef<{ todos: any[]; completeMode: boolean }>({
    todos: [],
    completeMode: false,
  });

  const pushChangesMutation = api.sync.pushChanges.useMutation({
    onSuccess: () => {
      setSyncStatus("idle");
      setLastSyncTimestamp(new Date().toISOString());
      // Update last sync reference
      lastSyncRef.current = { todos, completeMode };
    },
    onError: (error) => {
      console.error("Auto-sync error:", error);
      setSyncStatus("error");
    },
  });

  const triggerAutoSync = useCallback(async () => {
    if (!autoSyncEnabled || !deviceId) return;

    // Check if data has actually changed
    const currentData = { todos, completeMode };
    const lastData = lastSyncRef.current;

    if (JSON.stringify(currentData) === JSON.stringify(lastData)) {
      return; // No changes to sync
    }

    setSyncStatus("syncing");
    try {
      await pushChangesMutation.mutateAsync({
        todos,
        completeMode,
        deviceId,
        syncVersion: 1,
      });
    } catch (error) {
      console.error("Auto-sync failed:", error);
      setSyncStatus("error");
    }
  }, [
    autoSyncEnabled,
    deviceId,
    todos,
    completeMode,
    pushChangesMutation,
    setSyncStatus,
  ]);

  // Debounced auto-sync trigger
  useEffect(() => {
    if (autoSyncEnabled && deviceId && todos.length >= 0) {
      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Set new timeout for debounced sync
      syncTimeoutRef.current = setTimeout(() => {
        void triggerAutoSync();
      }, 2000); // 2 second debounce
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [autoSyncEnabled, deviceId, triggerAutoSync]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize last sync reference
  useEffect(() => {
    lastSyncRef.current = { todos, completeMode };
  }, []);

  return { triggerAutoSync };
};
