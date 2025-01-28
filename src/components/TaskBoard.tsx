import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, MoreVertical, Calendar, Flag } from 'lucide-react';
import type { Board, Task } from '../types';

interface TaskBoardProps {
  boards: Board[];
  onBoardUpdate: (board: Board) => void;
  onAddBoard: () => void;
  onAddTask: (boardId: string) => void;
}

export function TaskBoard({ boards, onBoardUpdate, onAddBoard, onAddTask }: TaskBoardProps) {
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceBoard = boards.find(b => b.id === source.droppableId);
    const destBoard = boards.find(b => b.id === destination.droppableId);

    if (!sourceBoard || !destBoard) return;

    if (source.droppableId === destination.droppableId) {
      // Reorder within same board
      const newTasks = Array.from(sourceBoard.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      onBoardUpdate({
        ...sourceBoard,
        tasks: newTasks
      });
    } else {
      // Move between boards
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
    <div className="flex-1 overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-4 min-h-[calc(100vh-4rem)]">
          {boards.map((board) => (
            <div key={board.id} className="flex-shrink-0 w-80 bg-gray-100 rounded-lg">
              <div className="p-3 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">{board.title}</h3>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <Droppable droppableId={board.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="p-2 space-y-2"
                  >
                    {board.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 rounded shadow-sm space-y-2"
                          >
                            <div className="text-sm font-medium">{task.title}</div>
                            {task.description && (
                              <p className="text-sm text-gray-600">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                              <div className={`flex items-center gap-1 ${
                                task.priority === 'high' ? 'text-red-500' :
                                task.priority === 'medium' ? 'text-yellow-500' :
                                'text-green-500'
                              }`}>
                                <Flag className="w-3 h-3" />
                                {task.priority}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <button
                      onClick={() => onAddTask(board.id)}
                      className="w-full p-2 text-sm text-gray-600 hover:bg-gray-200 rounded flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add task
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
          
          <button
            onClick={onAddBoard}
            className="flex-shrink-0 w-80 h-fit bg-gray-100 rounded-lg p-3 hover:bg-gray-200 flex items-center gap-2 text-gray-600"
          >
            <Plus className="w-5 h-5" />
            Add new board
          </button>
        </div>
      </DragDropContext>
    </div>
  );
}