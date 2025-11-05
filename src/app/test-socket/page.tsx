'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/socket-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';

export default function SocketTestPage() {
  const { isConnected, joinBoard, leaveBoard, createTask, onTaskCreated } = useSocket();
  const [testTaskTitle, setTestTaskTitle] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [boardId, setBoardId] = useState('675c123456789abcdef12345'); // Test board ID

  useEffect(() => {
    // Listen for task creation events
    const unsubscribe = onTaskCreated((task) => {
      setReceivedMessages(prev => [...prev, `Task created: ${task.title} at ${new Date().toLocaleTimeString()}`]);
    });

    return unsubscribe;
  }, [onTaskCreated]);

  const handleJoinBoard = () => {
    if (boardId) {
      joinBoard(boardId);
      setReceivedMessages(prev => [...prev, `Joined board: ${boardId}`]);
    }
  };

  const handleLeaveBoard = () => {
    leaveBoard();
    setReceivedMessages(prev => [...prev, `Left board at ${new Date().toLocaleTimeString()}`]);
  };

  const handleCreateTask = () => {
    if (testTaskTitle.trim()) {
      createTask({
        title: testTaskTitle,
        status: 'todo',
        boardId: boardId,
        description: 'Test task created via Socket.IO'
      });
      setTestTaskTitle('');
    }
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Socket.IO Test Page</h1>
      
      {/* Real Socket.IO Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            LIVE
          </span>
          <span className="text-green-800 font-semibold">Real Socket.IO Implementation</span>
        </div>
        <p className="text-green-700 text-sm">
          Connected to real Socket.IO server at <code className="bg-green-100 px-1 rounded">localhost:5000</code>. 
          All events are now synchronized with your backend and database.
        </p>
      </div>
      
      {/* Connection Status */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-semibold">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Real Socket.IO connection active' : 'Connecting to Socket.IO server...'}
          </span>
        </div>
      </Card>

      {/* Board Management */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Board Management</h3>
        <div className="flex gap-2 items-center mb-2">
          <InputText
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            placeholder="Board ID"
            className="flex-1"
          />
          <Button 
            label="Join Board" 
            onClick={handleJoinBoard}
            disabled={!isConnected || !boardId}
            className="p-button-sm"
          />
          <Button 
            label="Leave Board" 
            onClick={handleLeaveBoard}
            disabled={!isConnected}
            className="p-button-sm p-button-secondary"
          />
        </div>
        <p className="text-sm text-gray-600">
          Use a real board ID from your database to test board-specific events
        </p>
      </Card>

      {/* Task Testing */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Create Test Task</h3>
        <div className="flex gap-2">
          <InputText
            value={testTaskTitle}
            onChange={(e) => setTestTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
          />
          <Button 
            label="Create Task" 
            onClick={handleCreateTask}
            disabled={!isConnected || !testTaskTitle.trim()}
            className="p-button-sm"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          This will create a real task in your database and emit Socket.IO events to all connected users
        </p>
      </Card>

      {/* Event Log */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Event Log</h3>
        <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
          {receivedMessages.length === 0 ? (
            <p className="text-gray-500 italic">No events received yet...</p>
          ) : (
            receivedMessages.map((message, index) => (
              <div key={index} className="py-1 border-b border-gray-200 last:border-b-0">
                {message}
              </div>
            ))
          )}
        </div>
        {receivedMessages.length > 0 && (
          <Button 
            label="Clear Log" 
            onClick={() => setReceivedMessages([])}
            className="p-button-sm p-button-secondary mt-2"
          />
        )}
      </Card>
      </div>
    </AuthGuard>
  );
}