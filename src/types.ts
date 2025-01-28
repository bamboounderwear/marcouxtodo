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

declare global {
  interface Window {
    netlifyIdentity: {
      on: (event: string, callback: Function) => void;
      open: (command?: string) => void;
      close: () => void;
      currentUser: () => any;
      logout: () => void;
    };
  }
}