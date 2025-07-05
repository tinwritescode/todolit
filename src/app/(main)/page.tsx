"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  TrendingUp,
  Plus,
  Trash2,
  Clock,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";
import {
  format,
  endOfWeek,
  endOfDay,
  addDays,
  isToday,
  isTomorrow,
} from "date-fns";
import { api } from "@/trpc/react";
import { type RouterOutputs } from "@/trpc/shared";

type Todo = RouterOutputs["todo"]["getAll"][0];
type Project = RouterOutputs["project"]["getAll"][0];

export default function TodoPage() {
  const [newTodoName, setNewTodoName] = useState("");
  const [newTodoDue, setNewTodoDue] = useState("today");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const utils = api.useUtils();
  const { data: todos = [] } = api.todo.getAll.useQuery();
  const { data: projects = [] } = api.project.getAll.useQuery();

  // Load last selected project from localStorage
  useEffect(() => {
    const lastProject = localStorage.getItem("last-selected-project");
    if (
      lastProject &&
      projects.some((p) => p.id === parseInt(lastProject, 10))
    ) {
      setSelectedProject(parseInt(lastProject, 10));
    }
  }, [projects]);

  // Save selected project to localStorage when it changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem("last-selected-project", selectedProject.toString());
    }
  }, [selectedProject]);

  const { mutate: createTodo } = api.todo.create.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const { mutate: toggleTodo } = api.todo.toggle.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const { mutate: deleteTodoMutation } = api.todo.delete.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const addTodo = () => {
    if (!newTodoName.trim() || !selectedProject) return;

    createTodo({
      title: newTodoName.trim(),
      projectId: selectedProject,
      dueDate: getDueDateFromOption(newTodoDue),
    });

    setNewTodoName("");
    setNewTodoDue("today");
    // Keep the selected project, don't reset it
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    toggleTodo({ id, completed });
  };

  const handleDeleteTodo = (id: number) => {
    deleteTodoMutation(id);
  };

  const getDueDateFromOption = (option: string): Date => {
    const now = new Date();
    switch (option) {
      case "today":
        return endOfDay(now);
      case "tomorrow":
        return endOfDay(addDays(now, 1));
      case "week":
        return endOfWeek(now, { weekStartsOn: 1 });
      default:
        return endOfDay(now);
    }
  };

  const getActiveTodos = () => todos.filter((todo) => !todo.completed);
  const isOverdue = (todo: Todo) =>
    !todo.completed && todo.dueDate && new Date() > todo.dueDate;

  const getDueDateLabel = (dueDate: Date | null) => {
    if (!dueDate) return "No due date";
    if (isToday(dueDate)) return "Today";
    if (isTomorrow(dueDate)) return "Tomorrow";
    return format(dueDate, "MMM d");
  };

  const getProjectById = (id: number | null) =>
    id ? projects.find((p) => p.id === id) || null : null;

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    overdue: todos.filter(
      (t) => !t.completed && t.dueDate && new Date() > t.dueDate,
    ).length,
    today: todos.filter((t) => !t.completed && t.dueDate && isToday(t.dueDate))
      .length,
    completionRate:
      todos.length > 0
        ? Math.round(
            (todos.filter((t) => t.completed).length / todos.length) * 100,
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today}
            </div>
            <p className="text-muted-foreground text-xs">Focus for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <p className="text-muted-foreground text-xs">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add New Task */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Task
              </CardTitle>
              <CardDescription>Plan your next action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  placeholder="What needs to be done?"
                  value={newTodoName}
                  onChange={(e) => setNewTodoName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Select value={newTodoDue} onValueChange={setNewTodoDue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">End of Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {projects.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={
                      selectedProject ? selectedProject.toString() : "none"
                    }
                    onValueChange={(value) =>
                      setSelectedProject(
                        value === "none" ? null : parseInt(value, 10),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    {/* save last project to choose to local storage, then project can be default as last project */}
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full ${project.color}`}
                            />
                            {project.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={addTodo}
                disabled={!newTodoName.trim() || !selectedProject}
                className="w-full"
              >
                Add Task
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>
                {getActiveTodos().length} tasks remaining
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getActiveTodos().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    All caught up!
                  </h3>
                  <p className="text-gray-500">
                    No active tasks. Great job staying organized!
                  </p>
                </div>
              ) : (
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {getActiveTodos().map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                        isOverdue(todo)
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked) =>
                          handleToggleTodo(todo.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {todo.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant={
                              isOverdue(todo) ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {getDueDateLabel(todo.dueDate)}
                          </Badge>
                          {todo.project && (
                            <Badge variant="outline" className="text-xs">
                              <div
                                className={`mr-1 h-2 w-2 rounded-full ${todo.project.color}`}
                              />
                              {todo.project.title}
                            </Badge>
                          )}
                          {isOverdue(todo) && (
                            <span className="text-xs font-medium text-red-600">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
