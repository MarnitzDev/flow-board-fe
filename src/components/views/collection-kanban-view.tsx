'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Collection, Project, TaskFilter, CreateCollectionForm } from '@/types/task';
import { collectionsApi, tasksApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { CollectionCard, UncategorizedSection, CollectionDialog } from '@/components/collections';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { KanbanView } from './kanban-view'; // Use existing kanban view as the board component
import { useRef } from 'react';

interface CollectionViewProps {
  filters: TaskFilter;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
}

// Component that organizes tasks by collections
export function CollectionKanbanView({ filters, onTaskClick, currentProject }: CollectionViewProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>();
  const { isAuthenticated, token } = useAuth();
  const socketContext = useSocket();
  const toast = useRef<Toast>(null);

  // Fetch collections and tasks
  const fetchData = async () => {
    if (!currentProject || !isAuthenticated || !token) {
      setCollections([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch collections and tasks in parallel
      const [collectionsResponse, tasksResponse] = await Promise.all([
        collectionsApi.getByProject(currentProject.id),
        tasksApi.getByProject(currentProject.id)
      ]);

      if (collectionsResponse.success && collectionsResponse.data) {
        setCollections(collectionsResponse.data);
      }

      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Loading Failed',
        detail: 'Failed to load collections and tasks'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProject, isAuthenticated, token]);

  // Socket event handlers for collections
  useEffect(() => {
    if (!socketContext?.isConnected) return;

    const unsubscribeCollectionCreated = socketContext.onCollectionCreated((collection: Collection) => {
      if (collection.projectId === currentProject?.id) {
        setCollections(prev => [...prev, collection]);
        toast.current?.show({
          severity: 'success',
          summary: 'Collection Created',
          detail: `Collection "${collection.name}" was created`
        });
      }
    });

    const unsubscribeCollectionUpdated = socketContext.onCollectionUpdated((collection: Collection) => {
      if (collection.projectId === currentProject?.id) {
        setCollections(prev => prev.map(c => c.id === collection.id ? collection : c));
        toast.current?.show({
          severity: 'info',
          summary: 'Collection Updated',
          detail: `Collection "${collection.name}" was updated`
        });
      }
    });

    const unsubscribeCollectionDeleted = socketContext.onCollectionDeleted((collectionId: string) => {
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      toast.current?.show({
        severity: 'warn',
        summary: 'Collection Deleted',
        detail: 'A collection was deleted'
      });
    });

    const unsubscribeTaskCreated = socketContext.onTaskCreated((task: Task) => {
      if (task.projectId === currentProject?.id) {
        setTasks(prev => [...prev, task]);
      }
    });

    const unsubscribeTaskUpdated = socketContext.onTaskUpdated((task: Task) => {
      if (task.projectId === currentProject?.id) {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      }
    });

    const unsubscribeTaskDeleted = socketContext.onTaskDeleted((taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    });

    return () => {
      unsubscribeCollectionCreated();
      unsubscribeCollectionUpdated();
      unsubscribeCollectionDeleted();
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
    };
  }, [socketContext, currentProject]);

  // Group tasks by collection
  const { collectionTasks, uncategorizedTasks } = useMemo(() => {
    const mainTasks = tasks.filter(task => !task.isSubtask);
    
    const collectionGroups: Record<string, Task[]> = {};
    const uncategorized: Task[] = [];

    mainTasks.forEach(task => {
      if (task.collectionId) {
        if (!collectionGroups[task.collectionId]) {
          collectionGroups[task.collectionId] = [];
        }
        collectionGroups[task.collectionId].push(task);
      } else {
        uncategorized.push(task);
      }
    });

    return {
      collectionTasks: collectionGroups,
      uncategorizedTasks: uncategorized
    };
  }, [tasks]);

  // Collection operations
  const handleCreateCollection = () => {
    setEditingCollection(undefined);
    setShowCollectionDialog(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowCollectionDialog(true);
  };

  const handleSaveCollection = async (formData: any) => {
    try {
      if (editingCollection) {
        const response = await collectionsApi.update(editingCollection.id, formData);
        if (response.success) {
          setCollections(prev => prev.map(c => c.id === editingCollection.id ? { ...editingCollection, ...formData } : c));
          
          // Emit socket event
          if (socketContext?.isConnected) {
            socketContext.updateCollection(editingCollection.id, formData);
          }
        }
      } else {
        const response = await collectionsApi.create({
          ...formData,
          projectId: currentProject!.id
        });
        if (response.success && response.data) {
          setCollections(prev => [...prev, response.data]);
          
          // Emit socket event
          if (socketContext?.isConnected) {
            socketContext.createCollection(response.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save collection:', error);
      throw error;
    }
  };

  const handleArchiveCollection = async (collection: Collection) => {
    try {
      const response = await collectionsApi.update(collection.id, {
        isArchived: !collection.isArchived
      });
      
      if (response.success) {
        setCollections(prev => prev.map(c => 
          c.id === collection.id ? { ...c, isArchived: !c.isArchived } : c
        ));
        
        // Emit socket event
        if (socketContext?.isConnected) {
          socketContext.updateCollection(collection.id, { isArchived: !collection.isArchived });
        }
      }
    } catch (error) {
      console.error('Failed to archive collection:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Archive Failed',
        detail: 'Failed to archive collection'
      });
    }
  };

  const handleDeleteCollection = (collection: Collection) => {
    confirmDialog({
      message: `Are you sure you want to delete "${collection.name}"? Tasks will be moved to uncategorized.`,
      header: 'Delete Collection',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await collectionsApi.delete(collection.id);
          if (response.success) {
            setCollections(prev => prev.filter(c => c.id !== collection.id));
            
            // Move tasks to uncategorized
            setTasks(prev => prev.map(task => 
              task.collectionId === collection.id 
                ? { ...task, collectionId: undefined }
                : task
            ));
            
            // Emit socket event
            if (socketContext?.isConnected) {
              socketContext.deleteCollection(collection.id);
            }
          }
        } catch (error) {
          console.error('Failed to delete collection:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Failed to delete collection'
          });
        }
      }
    });
  };

  // Toolbar content
  const leftToolbarTemplate = () => (
    <div className="flex gap-2 align-items-center">
      <Button
        icon="pi pi-plus"
        label="New Collection"
        size="small"
        onClick={handleCreateCollection}
      />
      <Button
        icon="pi pi-plus"
        label="New Task"
        size="small"
        outlined
        onClick={() => onTaskClick()}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-20rem">
        <i className="pi pi-spin pi-spinner text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="collection-kanban-view h-full">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <Toolbar
        left={leftToolbarTemplate}
        className="mb-4 bg-white border border-gray-200 rounded-lg"
      />

      <div className="collections-container space-y-4 h-full overflow-auto">
        {/* Active Collections */}
        {collections
          .filter(c => !c.isArchived)
          .sort((a, b) => a.order - b.order)
          .map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              tasks={collectionTasks[collection.id] || []}
              onEditCollection={handleEditCollection}
              onArchiveCollection={handleArchiveCollection}
              onDeleteCollection={handleDeleteCollection}
              onTaskClick={onTaskClick}
            >
              <KanbanBoard
                tasks={collectionTasks[collection.id] || []}
                onTaskClick={onTaskClick}
                currentProject={currentProject}
                collectionId={collection.id}
                filters={filters}
              />
            </CollectionCard>
          ))}

        {/* Uncategorized Tasks */}
        {uncategorizedTasks.length > 0 && (
          <UncategorizedSection tasks={uncategorizedTasks}>
            <KanbanBoard
              tasks={uncategorizedTasks}
              onTaskClick={onTaskClick}
              currentProject={currentProject}
              filters={filters}
            />
          </UncategorizedSection>
        )}

        {/* Empty State */}
        {collections.length === 0 && uncategorizedTasks.length === 0 && (
          <div className="text-center py-8">
            <i className="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No collections or tasks</h3>
            <p className="text-gray-500 mb-4">Create your first collection to organize your tasks</p>
            <Button
              icon="pi pi-plus"
              label="Create Collection"
              onClick={handleCreateCollection}
            />
          </div>
        )}
      </div>

      {/* Collection Dialog */}
      <CollectionDialog
        visible={showCollectionDialog}
        collection={editingCollection}
        onHide={() => setShowCollectionDialog(false)}
        onSave={handleSaveCollection}
      />
    </div>
  );
}