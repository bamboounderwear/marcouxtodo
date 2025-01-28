export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  starred: boolean;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Board {
  id: string;
  title: string;
  tasks: Task[];
}