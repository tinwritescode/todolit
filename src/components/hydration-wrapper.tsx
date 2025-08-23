"use client";

import { useEffect, useState } from "react";
import { useTodoStore } from "@/store/todo-store";

export function HydrationWrapper({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Hydrate the store
    void useTodoStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}
