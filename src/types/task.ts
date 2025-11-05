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
  labels: Label[];
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
  author: User;
  taskId: string;
  createdAt: Date;
  mentions: string[]; // user IDs mentioned
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
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
}

export interface TaskSort {
  field: 'title' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt';
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
  labels: string[];
  columnId: string;
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
  'comment:added': Comment;
  'user:joined': User;
  'user:left': string;
}