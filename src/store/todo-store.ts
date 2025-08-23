import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  description?: string;
  deadline?: string;
  repeatDaily?: boolean;
  lastCompletedDate?: string; // Track when daily todos were last completed
  completeLogs: string[]; // Array of completion timestamps
}

interface TodoStore {
  todos: Todo[];
  completeMode: boolean;
  setCompleteMode: (mode: boolean) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  updateTodo: (id: number, text: string) => void;
  updateTodoDetails: (
    id: number,
    updates: Partial<
      Pick<Todo, "text" | "description" | "deadline" | "repeatDaily">
    >,
  ) => void;
  resetDailyTodos: () => void; // New function to reset daily todos
  completedCount: number;
  totalCount: number;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [],
      completeMode: false,
      setCompleteMode: (mode: boolean) => set({ completeMode: mode }),
      addTodo: (text: string) => {
        if (text.trim() !== "") {
          set((state) => ({
            todos: [
              ...state.todos,
              {
                id: Date.now(),
                text: text.trim(),
                completed: false,
                completeLogs: [],
              },
            ],
          }));
        }
      },
      toggleTodo: (id: number) => {
        const today = new Date().toDateString();
        const timestamp = new Date().toISOString();
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.id === id) {
              const newCompleted = !todo.completed;
              const updatedLogs = newCompleted
                ? [...(todo.completeLogs || []), timestamp]
                : todo.completeLogs || [];

              if (newCompleted && todo.repeatDaily) {
                return {
                  ...todo,
                  completed: newCompleted,
                  lastCompletedDate: today,
                  completeLogs: updatedLogs,
                };
              }
              return {
                ...todo,
                completed: newCompleted,
                completeLogs: updatedLogs,
              };
            }
            return todo;
          }),
        }));
      },
      deleteTodo: (id: number) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }));
      },
      updateTodo: (id: number, text: string) => {
        if (text.trim() !== "") {
          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, text: text.trim() } : todo,
            ),
          }));
        }
      },
      updateTodoDetails: (
        id: number,
        updates: Partial<
          Pick<Todo, "text" | "description" | "deadline" | "repeatDaily">
        >,
      ) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...updates } : todo,
          ),
        }));
      },
      resetDailyTodos: () => {
        const today = new Date().toDateString();
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (
              todo.repeatDaily &&
              todo.completed &&
              todo.lastCompletedDate !== today
            ) {
              return { ...todo, completed: false };
            }
            return todo;
          }),
        }));
      },
      get completedCount() {
        return get().todos.filter((todo) => todo.completed).length;
      },
      get totalCount() {
        return get().todos.length;
      },
    }),
    {
      name: "todo-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
