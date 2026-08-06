"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Todo,
  filterTodos,
  loadTodos,
  saveTodos,
} from "@/lib/todos";

const FILTERS: Filter[] = ["all", "active", "completed"];

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTodos(loadTodos());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTodos(todos);
  }, [todos, loaded]);

  const visibleTodos = useMemo(
    () => filterTodos(todos, filter),
    [todos, filter],
  );
  const remaining = todos.filter((todo) => !todo.completed).length;

  function addTodo() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTodos((current) => [
      {
        id: crypto.randomUUID(),
        title: trimmed,
        completed: false,
        createdAt: Date.now(),
      },
      ...current,
    ]);
    setTitle("");
  }

  function toggleTodo(id: string) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((current) => current.filter((todo) => !todo.completed));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Todos</h1>
        <p className="text-sm opacity-70">
          Saved in your browser&apos;s local storage.
        </p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addTodo();
        }}
      >
        <input
          aria-label="New todo"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          value={title}
        />
        <button
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-40"
          disabled={!title.trim()}
          type="submit"
        >
          Add
        </button>
      </form>

      <div className="flex gap-2">
        {FILTERS.map((option) => (
          <button
            aria-pressed={filter === option}
            className={`rounded-md px-3 py-1 text-sm capitalize ${
              filter === option
                ? "bg-foreground text-background"
                : "border border-black/15 dark:border-white/20"
            }`}
            key={option}
            onClick={() => setFilter(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
        {visibleTodos.map((todo) => (
          <li className="flex items-center gap-3 py-3" key={todo.id}>
            <input
              aria-label={`Toggle ${todo.title}`}
              checked={todo.completed}
              className="size-4"
              onChange={() => toggleTodo(todo.id)}
              type="checkbox"
            />
            <span
              className={`flex-1 ${todo.completed ? "line-through opacity-50" : ""}`}
            >
              {todo.title}
            </span>
            <button
              aria-label={`Delete ${todo.title}`}
              className="text-sm opacity-60 hover:opacity-100"
              onClick={() => deleteTodo(todo.id)}
              type="button"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {loaded && todos.length === 0 && (
        <p className="text-sm opacity-60">Nothing here yet. Add your first todo.</p>
      )}

      {todos.length > 0 && (
        <footer className="flex items-center justify-between text-sm opacity-70">
          <span>{remaining} remaining</span>
          <button
            className="hover:underline disabled:opacity-40 disabled:no-underline"
            disabled={remaining === todos.length}
            onClick={clearCompleted}
            type="button"
          >
            Clear completed
          </button>
        </footer>
      )}
    </main>
  );
}
