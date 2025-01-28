import React, { useEffect, useState } from 'react';
import { TaskBoard } from './components/TaskBoard';
import { Board, Task } from './types';
import { Briefcase, LogOut } from 'lucide-react';
import { PasswordSetup } from './components/PasswordSetup';

declare global {
  interface Window {
    netlifyIdentity: any;
  }
}

function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const { netlifyIdentity } = window;
    
    if (!netlifyIdentity) {
      console.error('Netlify Identity not loaded');
      return;
    }

    // Check for invite token immediately
    const hash = window.location.hash;
    if (hash.includes('invite_token=')) {
      const token = hash.split('invite_token=')[1];
      setInviteToken(token);
      // Clear the URL without triggering a reload
      window.history.replaceState(null, '', window.location.pathname);
    }

    netlifyIdentity.on('init', (user: any) => {
      console.log('Identity initialized', { user });
      setUser(user);
      setIdentityReady(true);
    });

    netlifyIdentity.on('login', (user: any) => {
      console.log('Login event', { user });
      setUser(user);
      setAuthError(null);
      setInviteToken(null);
      fetchBoards();
    });

    netlifyIdentity.on('logout', () => {
      setUser(null);
      setBoards([]);
    });

    netlifyIdentity.on('error', (err: Error) => {
      console.error('Identity error:', err);
      setAuthError(err.message);
    });

    // If there's an invite token, open the widget
    if (hash.includes('invite_token=') || hash.includes('recovery_token=')) {
      netlifyIdentity.open('signup');
    }

    return () => {
      netlifyIdentity.off('init');
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
      netlifyIdentity.off('error');
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

  const handleLogout = () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.logout();
    }
  };

  if (!identityReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show password setup if we have an invite token
  if (inviteToken) {
    return <PasswordSetup token={inviteToken} onError={setAuthError} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Tasks</h1>
        </div>
        {authError && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {authError}
          </div>
        )}
        <button
          onClick={() => window.netlifyIdentity?.open('login')}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-gray-900" />
              </div>
              <h1 className="text-xl font-semibold">Marketing Tasks</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">{user.email}</span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
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

export default App