"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Check,
  Edit3,
  FileEdit,
  Mic,
  Plus,
  Repeat,
  Settings,
  Trash2,
} from "lucide-react";

import { EditTodoDialog } from "@/components/edit-todo-dialog";
import { HydrationWrapper } from "@/components/hydration-wrapper";
import { SyncIndicator } from "@/components/sync-indicator";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useEditTodo } from "@/hooks/use-edit-todo";
import { useLongPress } from "@/hooks/use-long-press";
import { useTodos } from "@/hooks/use-todos";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { useTodoStore } from "@/store/todo-store";
import { api } from "@/trpc/react";

export default function TodoApp() {
  const [inputValue, setInputValue] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const transcribeMutation = api.speechToText.transcribe.useMutation();

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

  const { completeMode, setCompleteMode } = useTodoStore();
  const { contextMenu, showContextMenu, hideContextMenu, handleRightClick } =
    useContextMenu();
  const { triggerAutoSync } = useAutoSync();
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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle complete mode with 'M' key
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setCompleteMode(!completeMode);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [completeMode, setCompleteMode]);

  const handleAddTodo = () => {
    addTodo(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  const handleSpeechToText = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsListening(false);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });

          // Convert to base64
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Audio = (reader.result as string).split(",")[1] ?? "";

            try {
              const result = await transcribeMutation.mutateAsync({
                audioData: base64Audio,
                mimeType: "audio/webm",
              });

              if (result.success && result.text) {
                setInputValue(result.text);
              } else {
                alert(`Transcription failed: ${result.error}`);
              }
            } catch (error) {
              console.error("Transcription error:", error);
              alert("Failed to transcribe audio. Please try again.");
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
        alert("Audio recording failed. Please try again.");
      };

      // Start recording
      recorder.start();
      setIsListening(true);
      setMediaRecorder(recorder);
    } catch (error) {
      console.error("Microphone access error:", error);
      alert(
        "Microphone access denied. Please allow microphone access and try again.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isListening) {
      mediaRecorder.stop();
    }
  };

  const handleTodoTouchStart = (e: React.TouchEvent, todoId: number) => {
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

  const handleTodoClick = (todoId: number) => {
    if (completeMode) {
      toggleTodo(todoId);
    }
  };

  return (
    <HydrationWrapper>
      <div
        className="bg-background min-h-screen p-2 sm:p-4"
        onClick={hideContextMenu}
      >
        <div className="mx-auto max-w-2xl">
          <Card className="gap-0 border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="sm:pb-6">
              <div className="flex flex-col gap-3 sm:mb-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg font-bold sm:text-2xl">
                  Simple To-Do List
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      Normal
                    </span>
                    <button
                      onClick={() => {
                        setCompleteMode(!completeMode);
                      }}
                      className={`focus:ring-ring relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none sm:h-6 sm:w-11 ${
                        completeMode ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`bg-background inline-block h-3 w-3 transform rounded-full transition-transform sm:h-4 sm:w-4 ${
                          completeMode
                            ? "translate-x-5 sm:translate-x-6"
                            : "translate-x-0.5 sm:translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      Complete
                    </span>
                    <span className="text-muted-foreground/60 text-xs">
                      (M)
                    </span>
                  </div>
                  <SyncIndicator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = "/settings")}
                    className="flex h-8 items-center justify-center gap-1.5 px-2 text-xs sm:h-auto sm:gap-2 sm:px-3 sm:text-sm"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    Settings
                  </Button>
                </div>
              </div>
              {totalCount > 0 && (
                <p className="text-muted-foreground text-center text-sm">
                  {completedCount} of {totalCount} completed
                </p>
              )}
              {completeMode && (
                <p className="text-center text-sm font-medium text-blue-600">
                  Click on tasks to mark as complete/incomplete
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
              {/* Add new todo */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm sm:text-base"
                />
                <Button
                  onClick={isListening ? stopRecording : handleSpeechToText}
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  disabled={transcribeMutation.isPending}
                  className="h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  onClick={handleAddTodo}
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {/* Todo list */}
              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm sm:py-8 sm:text-base">
                    No tasks yet. Add one above!
                  </p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`hover:bg-accent/50 flex items-start gap-2 rounded-lg border p-2.5 transition-colors sm:items-center sm:gap-3 sm:p-3 ${
                        completeMode ? "cursor-pointer" : ""
                      }`}
                      onClick={() => handleTodoClick(todo.id)}
                      onContextMenu={(e) => handleRightClick(e, todo.id)}
                      onTouchStart={(e) => handleTodoTouchStart(e, todo.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => {
                          if (!completeMode) {
                            toggleTodo(todo.id);
                          }
                        }}
                        className={`mt-0.5 ${completeMode ? "pointer-events-none" : ""}`}
                      />
                      <div className="min-w-0 flex-1">
                        {editingId === todo.id ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              handleEditKeyPress(e, todo.id, updateTodo)
                            }
                            onBlur={() => saveEdit(todo.id, updateTodo)}
                            className="w-full text-sm sm:text-base"
                            autoFocus
                          />
                        ) : (
                          <div>
                            <span
                              className={`block text-sm break-words sm:text-base ${todo.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                            >
                              {todo.text}
                            </span>
                            {todo.description && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {todo.description}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                        className="text-destructive hover:text-destructive h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
