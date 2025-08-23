"use client"

import type React from "react"

import { useState } from "react"

interface ContextMenuState {
  x: number
  y: number
  todoId: number
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const showContextMenu = (x: number, y: number, todoId: number) => {
    setContextMenu({ x, y, todoId })
  }

  const hideContextMenu = () => {
    setContextMenu(null)
  }

  const handleRightClick = (e: React.MouseEvent, todoId: number) => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, todoId)
  }

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    handleRightClick,
  }
}
