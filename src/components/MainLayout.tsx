"use client";

import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  navigation?: ReactNode;
}

export function MainLayout({ children, title, navigation }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-background fixed top-0 right-0 left-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex w-full items-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold capitalize">{title}</h1>
          </div>
          <Separator orientation="vertical" className="mr-2 h-4" />
          {navigation}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 pt-20">{children}</main>

      {/* Footer */}
      <footer className="bg-background flex h-12 shrink-0 items-center gap-2 border-t">
        <div className="flex w-full items-center gap-2 px-4">
          <span className="text-muted-foreground text-sm">
            © 2024 TaskFlow. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
