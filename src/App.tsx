import React, { useEffect, useState } from 'react';
import { TaskBoard } from './components/TaskBoard';
import { Board, Task } from './types';
import { LogOut } from 'lucide-react';

function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = window.netlifyIdentity.currentUser();
    setUser(currentUser);

    // Listen for login/logout events
    window.netlifyIdentity.on('login', (user: any) => {
      setUser(user);
      window.netlifyIdentity.close();
      fetchBoards();
    });

    window.netlifyIdentity.on('logout', () => {
      setUser(null);
      setBoards([]);
    });

    if (currentUser) {
      fetchBoards();
    } else {
      setLoading(false);
    }

    return () => {
      window.netlifyIdentity.off('login');
      window.netlifyIdentity.off('logout');
    };
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/.netlify/functions/tasks');
      const data = await response.json();
      setBoards(data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardUpdate = async (updatedBoard: Board) => {
    try {
      await fetch('/.netlify/functions/tasks', {
        method: 'PUT',
        body: JSON.stringify(updatedBoard),
      });
      
      setBoards(boards.map(board => 
        board.id === updatedBoard.id ? updatedBoard : board
      ));
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  const handleAddBoard = async (title: string) => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title,
      tasks: []
    };

    try {
      const response = await fetch('/.netlify/functions/tasks', {
        method: 'PUT',
        body: JSON.stringify(newBoard),
      });
      const data = await response.json();
      setBoards([...boards, { ...newBoard, id: data.id }]);
    } catch (error) {
      console.error('Error adding board:', error);
    }
  };

  const handleAddTask = async (boardId: string, title: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      starred: false,
      status: 'todo'
    };

    const updatedBoard = {
      ...board,
      tasks: [...board.tasks, newTask]
    };

    await handleBoardUpdate(updatedBoard);
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await fetch(`/.netlify/functions/tasks?id=${boardId}`, {
        method: 'DELETE',
      });
      setBoards(boards.filter(board => board.id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <img src="/logo.png" alt="Logo" className="h-12 w-auto mb-8" />
        <button
          onClick={() => window.netlifyIdentity.open('login')}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{user.email}</span>
              <button
                onClick={() => window.netlifyIdentity.logout()}
                className="p-2 hover:bg-gray-800 rounded-full"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <TaskBoard
          boards={boards}
          onBoardUpdate={handleBoardUpdate}
          onAddBoard={handleAddBoard}
          onAddTask={handleAddTask}
          onDeleteBoard={handleDeleteBoard}
        />
      </main>
    </div>
  );
}

export default App;