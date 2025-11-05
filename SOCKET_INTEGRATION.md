# Socket.IO Integration Guide

## Current Setup (Mock Implementation)

We've implemented a **mock Socket.IO service** for testing collaborative features without requiring a real Socket.IO server. This allows you to:

- Test real-time UI updates
- See user presence indicators
- Experience typing notifications
- Verify task synchronization events

## Mock Features

The mock implementation simulates:

✅ **Connection Management**
- Automatic connection/disconnection
- Connection status indicators

✅ **User Presence**
- Simulated active users joining/leaving
- User avatars in the status bar

✅ **Real-time Task Events**
- Task creation, updates, deletion
- Task movement between columns
- Live event notifications

✅ **Typing Indicators**
- Shows when users are typing
- Auto-cleanup after timeout

## Switching to Real Socket.IO

When you're ready to implement real Socket.IO on your backend:

### 1. Backend Setup

Install Socket.IO on your backend:
```bash
npm install socket.io
```

Add Socket.IO to your Express server:
```javascript
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// JWT Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token here
  if (valid) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

// Socket event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Board room management
  socket.on('join:board', (boardId) => {
    socket.join(boardId);
    socket.to(boardId).emit('user:joined', {
      userId: socket.userId,
      username: socket.username
    });
  });
  
  // Task events
  socket.on('task:create', async (taskData) => {
    // Create task in database
    const newTask = await createTask(taskData);
    
    // Emit to all users in the board
    io.to(taskData.boardId).emit('task:created', newTask);
  });
  
  // Add more event handlers...
});
```

### 2. Frontend Update

Simply replace the mock service with the real one in `/src/context/socket-context.tsx`:

```typescript
// Change this line:
import { mockSocketService } from '@/lib/mock-socket';

// To this:
import { socketService } from '@/lib/socket';

// Then replace all mockSocketService calls with socketService
```

### 3. Configuration

Update the Socket.IO connection URL in `/src/lib/socket.ts`:
```typescript
this.socket = io('http://your-backend-domain.com', {
  auth: {
    token: token || ''
  }
});
```

## Testing the Mock Implementation

1. **Visit the Test Page**: `/test-socket`
   - See connection status
   - Test board joining
   - Create tasks and see events

2. **Use the Kanban Board**: `/dashboard/projects/[id]/kanban`
   - Notice the real-time status bar
   - See active users and typing indicators
   - Create/update tasks to see live events

3. **Open Multiple Browser Tabs**
   - Test collaborative features
   - See user presence simulation
   - Experience real-time updates

## Benefits of This Approach

- ✅ **No Backend Dependency**: Test collaborative features immediately
- ✅ **Full UI Implementation**: All real-time components are ready
- ✅ **Easy Migration**: Simple one-line change to switch to real Socket.IO
- ✅ **Realistic Testing**: Mock behaves like real Socket.IO events
- ✅ **Development Speed**: Continue frontend development without waiting for backend

## Next Steps

1. Test all collaborative features with the mock
2. Set up Socket.IO on your backend when ready
3. Update the import statement to use real Socket.IO
4. Configure JWT authentication on the backend
5. Deploy with real-time collaborative editing!

The mock implementation provides identical interfaces to the real Socket.IO service, so switching is seamless.