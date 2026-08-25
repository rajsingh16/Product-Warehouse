import { mockTasks } from '../data/mockData';
import type { Task } from '../types';

const TASKS_KEY = 'pw_tasks';

function loadTasks(): Task[] {
  const stored = localStorage.getItem(TASKS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(TASKS_KEY, JSON.stringify(mockTasks));
  return structuredClone(mockTasks);
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const taskService = {
  async getTasks(): Promise<Task[]> {
    await delay(150);
    return loadTasks();
  },

  async createTask(input: Omit<Task, 'id'>): Promise<Task> {
    await delay(200);
    if (!input.taskId.trim() || !input.description.trim() || !input.assignedTo.employeeId || !input.assignedOn) {
      throw new Error('Task ID, description, assigned employee, and assigned date are required.');
    }
    const tasks = loadTasks();
    if (tasks.some((task) => task.taskId.toLowerCase() === input.taskId.trim().toLowerCase())) {
      throw new Error('Task ID already exists.');
    }
    const task: Task = { ...input, id: generateId(), taskId: input.taskId.trim(), description: input.description.trim() };
    tasks.unshift(task);
    saveTasks(tasks);
    return task;
  },

  async updateTask(id: string, input: Omit<Task, 'id'>): Promise<Task> {
    await delay(200);
    const tasks = loadTasks();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) throw new Error('Task not found.');
    const updated: Task = { ...input, id, taskId: input.taskId.trim(), description: input.description.trim() };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    await delay(200);
    saveTasks(loadTasks().filter((task) => task.id !== id));
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Future: GET/POST/PUT/DELETE /api/tasks
