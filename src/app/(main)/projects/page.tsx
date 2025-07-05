"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MotionCard = motion(Card);

interface Todo {
  completed: boolean;
}

interface Project {
  id: number;
  title: string;
  description: string | null;
  color: string;
  todos: Todo[];
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: number) => void;
  deleteDisabled: boolean;
}

function ProjectCard({ project, onDelete, deleteDisabled }: ProjectCardProps) {
  const router = useRouter();
  const projectTodos = project.todos;
  const completedTodos = projectTodos.filter((todo) => todo.completed);
  const completionRate =
    projectTodos.length > 0
      ? Math.round((completedTodos.length / projectTodos.length) * 100)
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="relative cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => router.push(`/projects/${project.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full ${project.color}`} />
            <CardTitle className="text-lg">{project.title}</CardTitle>
          </div>
          {project.description && (
            <CardDescription>{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{completedTodos.length} completed</span>
              <span>{projectTodos.length} total</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{completionRate}% complete</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                disabled={deleteDisabled}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectsPageContent() {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const utils = api.useUtils();
  const { data: projects = [], isLoading } = api.project.getAll.useQuery();

  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
      setNewProjectName("");
      setNewProjectDescription("");
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onMutate: async (projectId) => {
      // Cancel any outgoing refetches
      await utils.project.getAll.cancel();
      // Snapshot the previous value
      const previousProjects = utils.project.getAll.getData();
      // Optimistically update to the new value
      utils.project.getAll.setData(undefined, (old) => {
        return old?.filter((p) => p.id !== projectId) ?? [];
      });
      // Add to deleting set for loading state
      setDeletingIds((prev) => new Set(prev).add(projectId));
      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, projectId, context) => {
      // Remove from deleting set
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        utils.project.getAll.setData(undefined, context.previousProjects);
      }
    },
    onSuccess: (_, projectId) => {
      // Remove from deleting set
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    },
    onSettled: () => {
      // Sync with server once mutation has settled
      utils.project.getAll.invalidate();
    },
  });

  const addProject = () => {
    if (!newProjectName.trim()) return;

    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const randomIndex = Math.floor(Math.random() * colors.length);
    const randomColor = colors[randomIndex] as string;

    createProject.mutate({
      title: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
      color: randomColor,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add New Project */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Project
              </CardTitle>
              <CardDescription>Organize your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addProject();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    placeholder="Enter project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Brief description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newProjectName.trim() || createProject.isPending}
                  className="w-full"
                >
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading..."
                  : `${projects.length} projects created`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                        <Skeleton className="mt-2 h-4 w-48" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No projects yet
                  </h3>
                  <p className="text-gray-500">
                    Create your first project to organize your tasks
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDelete={(id) => deleteProject.mutate(id)}
                        deleteDisabled={deletingIds.has(project.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <ProjectsPageContent />
    </AuthGuard>
  );
}
