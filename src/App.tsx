import React, { useEffect, useState } from 'react';
import { TaskBoard } from './components/TaskBoard';
import { Board, Task } from './types';
import { Briefcase } from 'lucide-react';

function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
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

  const handleAddBoard = async () => {
    const title = prompt('Enter board title:');
    if (!title) return;

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

  const handleAddTask = async (boardId: string) => {
    const title = prompt('Enter task title:');
    if (!title) return;

    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      priority: 'medium',
      status: 'todo'
    };

    const updatedBoard = {
      ...board,
      tasks: [...board.tasks, newTask]
    };

    await handleBoardUpdate(updatedBoard);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            <h1 className="text-xl font-semibold">Marketing Agency Tasks</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <TaskBoard
          boards={boards}
          onBoardUpdate={handleBoardUpdate}
          onAddBoard={handleAddBoard}
          onAddTask={handleAddTask}
        />
      </main>
    </div>
  );
}

export default App;