"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";

interface Todo {
  id: string;
  completed: boolean;
  createdAt: Date;
}

interface Project {
  id: string;
}

export default function ProfilePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("habit-todos");
    const savedProjects = localStorage.getItem("habit-projects");

    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        id: todo.id,
        completed: todo.completed,
        createdAt: new Date(todo.createdAt),
      }));
      setTodos(parsedTodos);
    }

    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects).map((project: any) => ({
        id: project.id,
      }));
      setProjects(parsedProjects);
    }
  }, []);

  const getStats = () => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const thisWeek = todos.filter(
      (t) => t.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, thisWeek, completionRate };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-lg">JD</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold">John Doe</h3>
                  <p className="text-sm text-gray-500">john.doe@example.com</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Member since</span>
                  <span className="text-sm font-medium">Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tasks completed</span>
                  <span className="text-sm font-medium">{stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Projects created</span>
                  <span className="text-sm font-medium">{projects.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Statistics
              </CardTitle>
              <CardDescription>Overview of your productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Overall Completion Rate
                    </span>
                    <span className="text-sm">{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Tasks This Week</span>
                    <span className="text-sm">{stats.thisWeek}</span>
                  </div>
                  <Progress value={stats.thisWeek * 10} />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {todos.length - stats.completed}
                  </div>
                  <div className="text-sm text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.thisWeek}
                  </div>
                  <div className="text-sm text-gray-500">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
          <CardDescription>Manage your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-500">
                  Receive email reminders for due tasks
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-gray-500">
                  Download your tasks and projects
                </p>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
