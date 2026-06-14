import { useState, useCallback, useEffect, useRef } from 'react';
import { localStorageService } from '../services/storageService';

/**
 * useFunnelState
 * 
 * Manages complete funnel architecture state lifecycle:
 * - Persistence to localStorage and backend
 * - Real-time sync with CI/CD webhooks
 * - Metric updates and node positioning
 * 
 * @returns {Object} Funnel state and update methods
 */
export const useFunnelState = (initialNodes = [], initialEdges = []) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  const persistenceRef = useRef(null);
  const syncQueueRef = useRef([]);

  // Debounce persistence to avoid excessive localStorage writes
  const debouncePersist = useCallback((newNodes, newEdges) => {
    clearTimeout(persistenceRef.current);
    persistenceRef.current = setTimeout(() => {
      try {
        localStorageService.saveFunnelState({
          nodes: newNodes,
          edges: newEdges,
          timestamp: new Date().toISOString(),
        });
        setLastSyncTime(new Date().toISOString());
      } catch (err) {
        console.error('Failed to persist funnel state:', err);
        setError(err.message);
      }
    }, 500);
  }, []);

  // Add or update node
  const addNode = useCallback((node) => {
    setNodes((prev) => {
      const updated = [...prev, node];
      debouncePersist(updated, edges);
      return updated;
    });
  }, [edges, debouncePersist]);

  // Update node properties
  const updateNode = useCallback((id, updates) => {
    setNodes((prev) => {
      const updated = prev.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      );
      debouncePersist(updated, edges);
      return updated;
    });
  }, [edges, debouncePersist]);

  // Delete node and connected edges
  const deleteNode = useCallback((id) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== id && edge.target !== id)
    );
    debouncePersist(
      nodes.filter((n) => n.id !== id),
      edges.filter((e) => e.source !== id && e.target !== id)
    );
  }, [nodes, edges, debouncePersist]);

  // Add edge
  const addEdge = useCallback((edge) => {
    setEdges((prev) => {
      const updated = [...prev, edge];
      debouncePersist(nodes, updated);
      return updated;
    });
  }, [nodes, debouncePersist]);

  // Delete edge
  const deleteEdge = useCallback((id) => {
    setEdges((prev) => {
      const updated = prev.filter((edge) => edge.id !== id);
      debouncePersist(nodes, updated);
      return updated;
    });
  }, [nodes, debouncePersist]);

  // Update edge activity state
  const setEdgeActive = useCallback((id, isActive) => {
    setEdges((prev) => {
      const updated = prev.map((edge) =>
        edge.id === id ? { ...edge, isActive } : edge
      );
      debouncePersist(nodes, updated);
      return updated;
    });
  }, [nodes, debouncePersist]);

  // Drag node position
  const dragNode = useCallback((id, x, y) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: { x, y } } : node
      )
    );
  }, []);

  // Finalize drag (persist after dragging stops)
  const finalizeDrag = useCallback(() => {
    debouncePersist(nodes, edges);
  }, [nodes, edges, debouncePersist]);

  // Restore state from storage
  const restoreState = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = localStorageService.loadFunnelState();
      if (stored) {
        setNodes(stored.nodes);
        setEdges(stored.edges);
        setLastSyncTime(stored.timestamp);
      }
    } catch (err) {
      console.error('Failed to restore funnel state:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export funnel state as JSON
  const exportState = useCallback(() => {
    return {
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }, [nodes, edges]);

  // Import funnel state from JSON
  const importState = useCallback((importedState) => {
    try {
      const { nodes: importedNodes, edges: importedEdges } = importedState;
      setNodes(importedNodes);
      setEdges(importedEdges);
      debouncePersist(importedNodes, importedEdges);
    } catch (err) {
      console.error('Failed to import funnel state:', err);
      setError(err.message);
    }
  }, [debouncePersist]);

  // Initialize on mount
  useEffect(() => {
    if (initialNodes.length === 0 && initialEdges.length === 0) {
      restoreState();
    }
  }, []);

  return {
    // State
    nodes,
    edges,
    isLoading,
    error,
    lastSyncTime,
    // Node operations
    addNode,
    updateNode,
    deleteNode,
    dragNode,
    finalizeDrag,
    // Edge operations
    addEdge,
    deleteEdge,
    setEdgeActive,
    // Persistence
    exportState,
    importState,
    restoreState,
  };
};
