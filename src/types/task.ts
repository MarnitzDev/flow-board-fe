// Task Management Types

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdBy: string;
  members: User[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  columns: Column[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
  taskIds: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  projectId: string;
  createdBy: string;
  order: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: User;
  reporter: User;
  projectId: string;
  boardId: string;
  columnId: string;
  collectionId?: string; // Optional - tasks can exist without collections
  parentTaskId?: string; // For subtasks
  isSubtask: boolean; // Auto-set when parentTaskId exists
  order: number; // For ordering within collections/columns
  createdBy: string; // Creator of the task
  labels: Label[];
  startDate?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  timeTracked: number; // in minutes
  dependencies: string[]; // task IDs this task depends on
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  content: string;
  createdBy: User; // Changed from 'author'
  taskId: string;
  mentions: string[]; // user IDs mentioned
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: User;
  createdAt: Date;
}

// View Types
export type ViewType = 'kanban' | 'list' | 'calendar' | 'gantt';

export interface ViewState {
  type: ViewType;
  filters: TaskFilter;
  sorting: TaskSort;
}

export interface TaskFilter {
  assignee?: string[];
  status?: string[];
  priority?: string[];
  labels?: string[];
  collectionId?: string[]; // Filter by collections
  parentTaskId?: string; // Filter by parent task (for subtasks)
  isSubtask?: boolean; // Filter subtasks vs main tasks
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
}

export interface TaskSort {
  field: 'title' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'order';
  direction: 'asc' | 'desc';
}

// UI State Types
export interface UIState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  selectedTask?: Task;
  currentProject?: Project;
  currentBoard?: Board;
  viewState: ViewState;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface CreateTaskForm {
  title: string;
  description?: string;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  startDate?: Date;
  labels: string[];
  columnId: string;
  collectionId?: string; // Optional collection assignment
  parentTaskId?: string; // For creating subtasks
}

export interface CreateCollectionForm {
  name: string;
  description?: string;
  color: string;
  projectId: string;
  order?: number;
}

export interface CreateProjectForm {
  name: string;
  description?: string;
  color: string;
  memberEmails: string[];
}

// Real-time Events
export interface SocketEvents {
  'task:created': Task;
  'task:updated': Task;
  'task:deleted': string;
  'task:moved': {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    position: number;
  };
  'subtask:created': Task;
  'subtask:updated': Task;
  'subtask:deleted': string;
  'collection:created': Collection;
  'collection:updated': Collection;
  'collection:deleted': string;
  'collection:reordered': {
    projectId: string;
    orders: Array<{ id: string; order: number }>;
  };
  'comment:added': Comment;
  'user:joined': User;
  'user:left': string;
}