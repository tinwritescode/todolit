"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  Plus,
  Edit3,
  FileEdit,
  Calendar,
  Repeat,
  Check,
} from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useLongPress } from "@/hooks/use-long-press";
import { useEditTodo } from "@/hooks/use-edit-todo";
import { EditTodoDialog } from "@/components/edit-todo-dialog";
import { HydrationWrapper } from "@/components/hydration-wrapper";

export default function TodoApp() {
  const [inputValue, setInputValue] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any>(null);

  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    updateTodoDetails,
    resetDailyTodos,
    completedCount,
    totalCount,
  } = useTodos();
  const { contextMenu, showContextMenu, hideContextMenu, handleRightClick } =
    useContextMenu();
  const {
    editingId,
    editValue,
    setEditValue,
    startEdit,
    saveEdit,
    handleEditKeyPress,
  } = useEditTodo();

  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useLongPress<number>((x, y, todoId) => {
      if (todoId !== undefined) {
        showContextMenu(x, y, todoId);
      }
    });

  useEffect(() => {
    resetDailyTodos();

    const interval = setInterval(() => {
      resetDailyTodos();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [resetDailyTodos]);

  const handleAddTodo = () => {
    addTodo(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  const handleTodoTouchStart = (e: React.TouchEvent, todoId: number) => {
    const touch = e.touches[0];
    handleTouchStart(e, todoId);
  };

  const handleOpenEditDialog = (todoId: number) => {
    const todo = todos.find((t) => t.id === todoId);
    if (todo) {
      setSelectedTodo(todo);
      setEditDialogOpen(true);
      hideContextMenu();
    }
  };

  return (
    <HydrationWrapper>
      <div className="bg-background min-h-screen p-4" onClick={hideContextMenu}>
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">
                Simple To-Do List
              </CardTitle>
              {totalCount > 0 && (
                <p className="text-muted-foreground text-center text-sm">
                  {completedCount} of {totalCount} completed
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new todo */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleAddTodo} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Todo list */}
              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No tasks yet. Add one above!
                  </p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                      onContextMenu={(e) => handleRightClick(e, todo.id)}
                      onTouchStart={(e) => handleTodoTouchStart(e, todo.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => {
                          toggleTodo(todo.id);
                        }}
                      />
                      <div className="flex-1">
                        {editingId === todo.id ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              handleEditKeyPress(e, todo.id, updateTodo)
                            }
                            onBlur={() => saveEdit(todo.id, updateTodo)}
                            className="w-full"
                            autoFocus
                          />
                        ) : (
                          <div>
                            <span
                              className={`block ${todo.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                            >
                              {todo.text}
                            </span>
                            {todo.description && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {todo.description}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              {todo.deadline && (
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(todo.deadline).toLocaleDateString()}
                                </span>
                              )}
                              {todo.repeatDaily && (
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                  <Repeat className="h-3 w-3" />
                                  Daily
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          deleteTodo(todo.id);
                        }}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {contextMenu && (
          <div
            className="bg-background fixed z-50 rounded-lg border py-1 shadow-lg"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
              onClick={() => {
                const todo = todos.find((t) => t.id === contextMenu.todoId);
                if (todo) {
                  startEdit(todo.id, todo.text);
                  hideContextMenu();
                }
              }}
            >
              <Edit3 className="h-4 w-4" />
              Rename
            </button>
            <button
              className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
              onClick={() => handleOpenEditDialog(contextMenu.todoId)}
            >
              <FileEdit className="h-4 w-4" />
              Edit
            </button>
            <button
              className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
              onClick={() => {
                toggleTodo(contextMenu.todoId);
                hideContextMenu();
              }}
            >
              {todos.find((t) => t.id === contextMenu.todoId)?.completed ? (
                <div className="border-muted-foreground h-4 w-4 rounded border-2" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {todos.find((t) => t.id === contextMenu.todoId)?.completed
                ? "Mark as incomplete"
                : "Mark as complete"}
            </button>
            <button
              className="hover:bg-accent text-destructive flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
              onClick={() => {
                deleteTodo(contextMenu.todoId);
                hideContextMenu();
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}

        <EditTodoDialog
          todo={selectedTodo}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={updateTodoDetails}
        />
      </div>
    </HydrationWrapper>
  );
}
