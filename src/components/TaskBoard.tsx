import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, MoreVertical, Calendar, Star, Trash2, Check } from 'lucide-react';
import type { Board, Task } from '../types';

interface TaskBoardProps {
  boards: Board[];
  onBoardUpdate: (board: Board) => void;
  onAddBoard: (title: string) => void;
  onAddTask: (boardId: string, title: string) => void;
  onDeleteBoard: (boardId: string) => void;
}

export function TaskBoard({ boards, onBoardUpdate, onAddBoard, onAddTask, onDeleteBoard }: TaskBoardProps) {
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({});
  const [showNewTaskForm, setShowNewTaskForm] = useState<Record<string, boolean>>({});
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  const starredTasks = boards.flatMap(board => 
    board.tasks
      .filter(task => task.starred)
      .map(task => ({
        ...task,
        boardTitle: board.title,
        boardId: board.id
      }))
  );

  const handleNewBoardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardTitle.trim()) {
      onAddBoard(newBoardTitle.trim());
      setNewBoardTitle('');
    }
  };

  const handleNewTaskSubmit = (e: React.FormEvent, boardId: string) => {
    e.preventDefault();
    const title = newTaskTitles[boardId]?.trim();
    if (title) {
      onAddTask(boardId, title);
      setNewTaskTitles(prev => ({ ...prev, [boardId]: '' }));
      setShowNewTaskForm(prev => ({ ...prev, [boardId]: false }));
    }
  };

  const handleDeleteTask = (boardId: string, taskId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const updatedBoard = {
      ...board,
      tasks: board.tasks.filter(task => task.id !== taskId)
    };

    onBoardUpdate(updatedBoard);
  };

  const handleToggleTaskStatus = (boardId: string, taskId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const updatedBoard = {
      ...board,
      tasks: board.tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
          : task
      )
    };

    onBoardUpdate(updatedBoard);
  };

  const handleToggleStarred = (boardId: string, taskId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const updatedTasks = board.tasks.map(task =>
      task.id === taskId ? { ...task, starred: !task.starred } : task
    );

    const sortedTasks = [...updatedTasks].sort((a, b) => {
      if (a.starred === b.starred) return 0;
      return a.starred ? -1 : 1;
    });

    const updatedBoard = {
      ...board,
      tasks: sortedTasks
    };

    onBoardUpdate(updatedBoard);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'priority') {
      const [taskId, originalBoardId] = source.draggableId.split('::');
      const destBoard = boards.find(b => b.id === destination.droppableId);
      if (!destBoard) return;

      const sourceBoard = boards.find(b => b.id === originalBoardId);
      if (!sourceBoard) return;

      const task = sourceBoard.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedSourceBoard = {
        ...sourceBoard,
        tasks: sourceBoard.tasks.map(t => 
          t.id === taskId ? { ...t, starred: false } : t
        )
      };

      onBoardUpdate(updatedSourceBoard);

      if (originalBoardId !== destination.droppableId) {
        const updatedDestBoard = {
          ...destBoard,
          tasks: [
            ...destBoard.tasks.slice(0, destination.index),
            { ...task, starred: false },
            ...destBoard.tasks.slice(destination.index)
          ]
        };
        onBoardUpdate(updatedDestBoard);
      }
      return;
    }

    if (destination.droppableId === 'priority') {
      const sourceBoard = boards.find(b => b.id === source.droppableId);
      if (!sourceBoard) return;

      const updatedBoard = {
        ...sourceBoard,
        tasks: sourceBoard.tasks.map(task => 
          task.id === result.draggableId ? { ...task, starred: true } : task
        )
      };

      onBoardUpdate(updatedBoard);
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const sourceBoard = boards.find(b => b.id === source.droppableId);
      if (!sourceBoard) return;

      const newTasks = Array.from(sourceBoard.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      onBoardUpdate({
        ...sourceBoard,
        tasks: newTasks
      });
    } else {
      const sourceBoard = boards.find(b => b.id === source.droppableId);
      const destBoard = boards.find(b => b.id === destination.droppableId);
      if (!sourceBoard || !destBoard) return;

      const sourceItems = Array.from(sourceBoard.tasks);
      const destItems = Array.from(destBoard.tasks);
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      onBoardUpdate({
        ...sourceBoard,
        tasks: sourceItems
      });
      onBoardUpdate({
        ...destBoard,
        tasks: destItems
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        <div className="sticky left-0 flex-shrink-0 w-80">
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-3 border-b border-gray-800 bg-blue-500">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5" fill="currentColor" />
                Priority Tasks
              </h3>
            </div>
            <Droppable droppableId="priority">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-2 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto"
                >
                  {starredTasks.map((task, index) => (
                    <Draggable 
                      key={`${task.id}::${task.boardId}`}
                      draggableId={`${task.id}::${task.boardId}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-gray-800 p-3 rounded shadow-sm space-y-2 ${
                            task.status === 'done' ? 'opacity-75' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className={`text-sm font-medium ${
                                task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-100'
                              }`}>
                                {task.title}
                              </div>
                              <div className="text-xs text-blue-400 mt-1">
                                {task.boardTitle}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleToggleStarred(task.boardId, task.id)}
                                className="p-1 rounded hover:bg-gray-700 text-yellow-500"
                              >
                                <Star className="w-4 h-4" fill="currentColor" />
                              </button>
                              <button
                                onClick={() => handleToggleTaskStatus(task.boardId, task.id)}
                                className={`p-1 rounded hover:bg-gray-700 ${
                                  task.status === 'done' ? 'text-green-500' : 'text-gray-400'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.boardId, task.id)}
                                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400">{task.description}</p>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto snap-x snap-mandatory">
          <div className="flex gap-4 p-4 min-h-[calc(100vh-4rem)]">
            {boards.map((board) => (
              <div key={board.id} className="flex-shrink-0 w-80 bg-gray-900 rounded-lg snap-center border border-gray-800">
                <div className="p-3 flex justify-between items-center border-b border-gray-800">
                  <h3 className="font-semibold text-white">{board.title}</h3>
                  <div className="relative">
                    <button 
                      onClick={() => setShowDeleteMenu(showDeleteMenu === board.id ? null : board.id)}
                      className="p-1 hover:bg-gray-800 rounded"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    {showDeleteMenu === board.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-800 z-10">
                        {boardToDelete === board.id ? (
                          <div className="p-3">
                            <p className="text-sm text-gray-300 mb-2">Delete this board?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  onDeleteBoard(board.id);
                                  setBoardToDelete(null);
                                  setShowDeleteMenu(null);
                                }}
                                className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => {
                                  setBoardToDelete(null);
                                  setShowDeleteMenu(null);
                                }}
                                className="flex-1 bg-gray-700 text-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setBoardToDelete(board.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg"
                          >
                            Delete board
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Droppable droppableId={board.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-2 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto"
                    >
                      {board.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-gray-800 p-3 rounded shadow-sm space-y-2 ${
                                task.status === 'done' ? 'opacity-75' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className={`text-sm font-medium ${
                                  task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-100'
                                }`}>
                                  {task.title}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleToggleStarred(board.id, task.id)}
                                    className={`p-1 rounded hover:bg-gray-700 ${
                                      task.starred ? 'text-yellow-500' : 'text-gray-400'
                                    }`}
                                  >
                                    <Star className="w-4 h-4" fill={task.starred ? 'currentColor' : 'none'} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleTaskStatus(board.id, task.id)}
                                    className={`p-1 rounded hover:bg-gray-700 ${
                                      task.status === 'done' ? 'text-green-500' : 'text-gray-400'
                                    }`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(board.id, task.id)}
                                    className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-400">{task.description}</p>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {showNewTaskForm[board.id] ? (
                        <form onSubmit={(e) => handleNewTaskSubmit(e, board.id)} className="space-y-2">
                          <input
                            type="text"
                            value={newTaskTitles[board.id] || ''}
                            onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [board.id]: e.target.value }))}
                            placeholder="Task title"
                            className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewTaskForm(prev => ({ ...prev, [board.id]: false }));
                                setNewTaskTitles(prev => ({ ...prev, [board.id]: '' }));
                              }}
                              className="flex-1 bg-gray-700 text-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowNewTaskForm(prev => ({ ...prev, [board.id]: true }))}
                          className="w-full p-2 text-sm text-gray-400 hover:bg-gray-800 rounded flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add task
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
            
            <div className="flex-shrink-0 w-80 snap-center">
              <form onSubmit={handleNewBoardSubmit} className="bg-gray-900 rounded-lg p-3 space-y-2 border border-gray-800">
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Enter board title"
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white p-2 rounded text-sm hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newBoardTitle.trim()}
                >
                  <Plus className="w-4 h-4" />
                  Add new board
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}