"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FolderOpen, Plus, Trash2, Pen } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const MotionCard = motion(Card);

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">
        Project not found
      </h3>
      <p className="mb-6 text-gray-500">
        This project might have been deleted or you don't have access to it.
      </p>
      <Button asChild>
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>
    </div>
  );
}

function SingleProjectContent() {
  const params = useParams();
  const projectId = Number(params.id);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const utils = api.useUtils();
  const {
    data: project,
    isLoading,
    error,
  } = api.project.getById.useQuery(projectId);

  const createTodo = api.todo.create.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate(projectId);
      setNewTodoTitle("");
    },
  });

  const toggleTodo = api.todo.toggle.useMutation({
    onMutate: async ({ id, completed }) => {
      await utils.project.getById.cancel();
      const previousProject = utils.project.getById.getData(projectId);

      if (previousProject) {
        utils.project.getById.setData(projectId, {
          ...previousProject,
          todos: previousProject.todos.map((todo) =>
            todo.id === id ? { ...todo, completed } : todo,
          ),
        });
      }

      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        utils.project.getById.setData(projectId, context.previousProject);
      }
    },
    onSettled: () => {
      utils.project.getById.invalidate(projectId);
    },
  });

  const deleteTodo = api.todo.delete.useMutation({
    onMutate: async (todoId) => {
      await utils.project.getById.cancel();
      const previousProject = utils.project.getById.getData(projectId);

      if (previousProject) {
        utils.project.getById.setData(projectId, {
          ...previousProject,
          todos: previousProject.todos.filter((todo) => todo.id !== todoId),
        });
      }

      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        utils.project.getById.setData(projectId, context.previousProject);
      }
    },
    onSettled: () => {
      utils.project.getById.invalidate(projectId);
    },
  });

  const updateTodoTitle = api.todo.updateTitle.useMutation({
    onMutate: async ({ id, title }) => {
      await utils.project.getById.cancel();
      const previousProject = utils.project.getById.getData(projectId);

      if (previousProject) {
        utils.project.getById.setData(projectId, {
          ...previousProject,
          todos: previousProject.todos.map((todo) =>
            todo.id === id ? { ...todo, title } : todo,
          ),
        });
      }

      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        utils.project.getById.setData(projectId, context.previousProject);
      }
    },
    onSettled: () => {
      utils.project.getById.invalidate(projectId);
      setEditingTodoId(null);
    },
  });

  const addTodo = () => {
    if (!newTodoTitle.trim()) return;
    createTodo.mutate({
      projectId,
      title: newTodoTitle.trim(),
    });
  };

  const startEditing = (todo: { id: number; title: string }) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleUpdateTitle = (id: number) => {
    if (!editingTitle.trim()) return;
    updateTodoTitle.mutate({
      id,
      title: editingTitle.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return <ErrorState />;
  }

  const completedTodos = project.todos.filter((todo) => todo.completed);
  const completionRate =
    project.todos.length > 0
      ? Math.round((completedTodos.length / project.todos.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-gray-500">{project.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            {completedTodos.length} of {project.todos.length} tasks completed
          </CardDescription>
          <Progress value={completionRate} className="h-2" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTodo();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Add a new task..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="h-8"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newTodoTitle.trim() || createTodo.isPending}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <AnimatePresence mode="popLayout">
              {project.todos.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No tasks yet. Add one above!
                </p>
              ) : (
                <div className="space-y-1">
                  {project.todos.map((todo) => (
                    <MotionCard
                      key={todo.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`border-0 bg-white/70 py-1 shadow-none backdrop-blur-sm transition-all duration-300 hover:bg-white/90 ${
                        todo.completed ? "opacity-75" : ""
                      }`}
                    >
                      <CardContent className="px-0 py-0">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`task-${todo.id}`}
                            checked={todo.completed}
                            onCheckedChange={(checked) =>
                              toggleTodo.mutate({
                                id: todo.id,
                                completed: checked === true,
                              })
                            }
                            className="h-4 w-4 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
                          />
                          <div className="min-w-0 flex-1">
                            {editingTodoId === todo.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleUpdateTitle(todo.id);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={editingTitle}
                                  onChange={(e) =>
                                    setEditingTitle(e.target.value)
                                  }
                                  className="h-7 py-0"
                                  autoFocus
                                  onBlur={() => handleUpdateTitle(todo.id)}
                                />
                              </form>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label
                                  htmlFor={`task-${todo.id}`}
                                  className={`block cursor-pointer text-sm transition-all duration-200 ${
                                    todo.completed
                                      ? "text-gray-500 line-through"
                                      : "text-gray-900 hover:text-blue-600"
                                  }`}
                                >
                                  {todo.title}
                                </label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(todo)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-900"
                                >
                                  <Pen className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(todo.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                              {todo.completed && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-xs text-green-700"
                                >
                                  Done
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTodo.mutate(todo.id)}
                            className="text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            aria-label="Remove task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </MotionCard>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SingleProjectPage() {
  return (
    <AuthGuard>
      <SingleProjectContent />
    </AuthGuard>
  );
}
