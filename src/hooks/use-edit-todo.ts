"use client"

import type React from "react"

import { useState } from "react"

export function useEditTodo() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  const startEdit = (id: number, text: string) => {
    setEditingId(id)
    setEditValue(text)
  }

  const saveEdit = (id: number, onSave: (id: number, text: string) => void) => {
    onSave(id, editValue)
    setEditingId(null)
    setEditValue("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue("")
  }

  const handleEditKeyPress = (e: React.KeyboardEvent, id: number, onSave: (id: number, text: string) => void) => {
    if (e.key === "Enter") {
      saveEdit(id, onSave)
    } else if (e.key === "Escape") {
      cancelEdit()
    }
  }

  return {
    editingId,
    editValue,
    setEditValue,
    startEdit,
    saveEdit,
    cancelEdit,
    handleEditKeyPress,
  }
}
