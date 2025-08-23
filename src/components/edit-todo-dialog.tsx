"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Todo {
  id: number
  text: string
  completed: boolean
  description?: string
  deadline?: string
  repeatDaily?: boolean
}

interface EditTodoDialogProps {
  todo: Todo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: number, updates: Partial<Pick<Todo, "text" | "description" | "deadline" | "repeatDaily">>) => void
}

export function EditTodoDialog({ todo, open, onOpenChange, onSave }: EditTodoDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [repeatDaily, setRepeatDaily] = useState(false)

  useEffect(() => {
    if (todo) {
      setName(todo.text)
      setDescription(todo.description || "")
      setDeadline(todo.deadline || "")
      setRepeatDaily(todo.repeatDaily || false)
    }
  }, [todo])

  const handleSave = () => {
    if (todo && name.trim()) {
      onSave(todo.id, {
        text: name.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        repeatDaily,
      })
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (todo) {
      setName(todo.text)
      setDescription(todo.description || "")
      setDeadline(todo.deadline || "")
      setRepeatDaily(todo.repeatDaily || false)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Task Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter task name..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="repeat"
              checked={repeatDaily}
              onCheckedChange={(checked) => setRepeatDaily(checked as boolean)}
            />
            <Label htmlFor="repeat">Repeat every day</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
