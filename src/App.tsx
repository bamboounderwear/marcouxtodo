import React, { useEffect, useState } from 'react';
import { TaskBoard } from './components/TaskBoard';
import { Board, Task } from './types';
import { Briefcase, LogOut } from 'lucide-react';

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

  useEffect(() => {
    // Initialize Netlify Identity
    const script = document.createElement('script');
    script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
    script.async = true;
    script.onload = initializeIdentity;
    document.head.appendChild(script);

    return () => {
      if (window.netlifyIdentity) {
        window.netlifyIdentity.off('init');
        window.netlifyIdentity.off('login');
        window.netlifyIdentity.off('logout');
        window.netlifyIdentity.off('error');
      }
    };
  }, []);

  const initializeIdentity = () => {
    const { netlifyIdentity } = window;
    
    if (!netlifyIdentity) {
      setTimeout(initializeIdentity, 100);
      return;
    }

    netlifyIdentity.on('init', (user: any) => {
      setUser(user);
      setIdentityReady(true);
      handleAuthFlow();
    });

    netlifyIdentity.on('login', (user: any) => {
      setUser(user);
      setAuthError(null);
      fetchBoards();
    });

    netlifyIdentity.on('logout', () => {
      setUser(null);
      setBoards([]);
    });

    netlifyIdentity.on('error', (err: Error) => {
      console.error('Identity error:', err);
      setAuthError(err.message);
      // Retry authentication flow after error
      setTimeout(handleAuthFlow, 1000);
    });

    netlifyIdentity.init({
      APIUrl: 'https://' + window.location.hostname + '/.netlify/identity',
      locale: 'en',
    });
  };

  const handleAuthFlow = () => {
    // Check URL hash for tokens
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    // Check URL query params for tokens
    const queryParams = new URLSearchParams(window.location.search);
    
    // Combine hash and query parameters
    const token = queryParams.get('token') || hashParams.get('token');
    const confirmationToken = queryParams.get('confirmation_token') || hashParams.get('confirmation_token');
    const recoveryToken = queryParams.get('recovery_token') || hashParams.get('recovery_token');
    const inviteToken = queryParams.get('invite_token') || hashParams.get('invite_token');
    const error = queryParams.get('error') || hashParams.get('error');
    const error_description = queryParams.get('error_description') || hashParams.get('error_description');

    if (error || error_description) {
      setAuthError(error_description || error || 'Authentication error occurred');
      return;
    }

    if (token || confirmationToken || recoveryToken || inviteToken) {
      console.log('Processing token:', { token, confirmationToken, recoveryToken, inviteToken });
      
      // Clear any existing widget state
      window.netlifyIdentity.close();
      
      // Force the widget to process the token
      if (inviteToken) {
        window.netlifyIdentity.store.set('usedInviteToken', inviteToken);
        window.netlifyIdentity.store.set('loginModal.isOpen', true);
        setTimeout(() => {
          window.netlifyIdentity.open('signup');
          // Additional force to ensure the signup form is shown
          const modal = document.querySelector('.netlify-identity-widget');
          if (modal) {
            modal.setAttribute('data-screen', 'signup');
          }
        }, 100);
      } else if (recoveryToken) {
        setTimeout(() => window.netlifyIdentity.open('recovery'), 100);
      } else if (confirmationToken) {
        setTimeout(() => window.netlifyIdentity.open('signup'), 100);
      } else {
        setTimeout(() => window.netlifyIdentity.open('login'), 100);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (!user) {
      // If no user and no special tokens, open login
      setTimeout(() => window.netlifyIdentity.open('login'), 500);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user]);

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
        <div className="animate-pulse text-sm text-gray-500">
          Opening authentication...
        </div>
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

export default App;