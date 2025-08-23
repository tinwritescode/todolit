"use client";

import { useTodoStore } from "../store/todo-store";

export function useTodos() {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    updateTodoDetails,
    resetDailyTodos, // Added resetDailyTodos function
    completedCount,
    totalCount,
  } = useTodoStore();

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    updateTodoDetails,
    resetDailyTodos, // Export resetDailyTodos function
    completedCount,
    totalCount,
  };
}
