"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Install Laputa</h3>
          <p className="mt-1 text-sm text-gray-500">
            Install this app on your device for quick and easy access when
            you&apos;re on the go.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={handleInstallClick} size="sm" className="flex-1">
          Install
        </Button>
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
