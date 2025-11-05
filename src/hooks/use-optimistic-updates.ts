import { useState, useCallback } from 'react';

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  data: Record<string, unknown>;
  timestamp: number;
  confirmed?: boolean;
}

export function useOptimisticUpdates() {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());

  const addOptimisticUpdate = useCallback((update: Omit<OptimisticUpdate, 'timestamp'>) => {
    const optimisticUpdate: OptimisticUpdate = {
      ...update,
      timestamp: Date.now(),
    };
    
    setPendingUpdates(prev => new Map(prev).set(update.id, optimisticUpdate));
    
    // Auto-remove after timeout if not confirmed
    setTimeout(() => {
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        const update = newMap.get(optimisticUpdate.id);
        if (update && !update.confirmed) {
          newMap.delete(optimisticUpdate.id);
        }
        return newMap;
      });
    }, 5000); // 5 second timeout
  }, []);

  const confirmUpdate = useCallback((updateId: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      const update = newMap.get(updateId);
      if (update) {
        newMap.set(updateId, { ...update, confirmed: true });
        // Remove confirmed updates after a short delay
        setTimeout(() => {
          setPendingUpdates(current => {
            const currentMap = new Map(current);
            currentMap.delete(updateId);
            return currentMap;
          });
        }, 1000);
      }
      return newMap;
    });
  }, []);

  const revertUpdate = useCallback((updateId: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(updateId);
      return newMap;
    });
  }, []);

  const getPendingUpdate = useCallback((updateId: string) => {
    return pendingUpdates.get(updateId);
  }, [pendingUpdates]);

  const hasPendingUpdate = useCallback((updateId: string) => {
    return pendingUpdates.has(updateId);
  }, [pendingUpdates]);

  const getAllPendingUpdates = useCallback(() => {
    return Array.from(pendingUpdates.values());
  }, [pendingUpdates]);

  return {
    addOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    getPendingUpdate,
    hasPendingUpdate,
    getAllPendingUpdates,
    pendingCount: pendingUpdates.size,
  };
}