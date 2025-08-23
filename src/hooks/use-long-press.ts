"use client";

import type React from "react";

import { useRef } from "react";

export function useLongPress<T = void>(
  onLongPress: (x: number, y: number, data?: T) => void,
  delay = 500,
) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const longPressData = useRef<T | null>(null);

  const handleTouchStart = (e: React.TouchEvent, data?: T) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressData.current = data ?? null;

    longPressTimer.current = setTimeout(() => {
      if (touchStartPos.current) {
        onLongPress(
          touchStartPos.current.x,
          touchStartPos.current.y,
          longPressData.current ?? undefined,
        );
      }
    }, delay);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPos.current && longPressTimer.current) {
      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

      // Cancel long press if user moves finger too much (more than 10px)
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
