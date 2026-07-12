import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export const FunnelContext = createContext();

export const useFunnel = () => {
  const context = useContext(FunnelContext);
  if (!context) {
    throw new Error('useFunnel must be used within a FunnelProvider');
  }
  return context;
};

export const FunnelProvider = ({
  children,
  initialNodes = [],
  initialEdges = [],
  onStateChange,
  autoSync = false,
}) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const syncCallbackRef = useRef(null);

  useEffect(() => {
    if (autoSync && onStateChange) {
      // Clear any existing sync timer to debounce rapid state changes (e.g., node dragging)
      if (syncCallbackRef.current) {
        clearTimeout(syncCallbackRef.current);
      }

      // Optimization: Debounce synchronization with external state (150ms).
      // This reduces the frequency of potentially expensive external callbacks or API syncs.
      syncCallbackRef.current = setTimeout(() => {
        onStateChange({ nodes, edges });
        syncCallbackRef.current = null;
      }, 150);
    }

    return () => {
      if (syncCallbackRef.current) {
        clearTimeout(syncCallbackRef.current);
      }
    };
  }, [nodes, edges, autoSync, onStateChange]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      // Optimization: Implement state bail-out if position hasn't actually changed or node not found.
      // This prevents React from triggering a reconciliation pass for the entire context consumer tree.
      const nodeToUpdate = prevNodes.find((n) => n.id === id);
      if (!nodeToUpdate || (nodeToUpdate.position.x === nextX && nodeToUpdate.position.y === nextY)) {
        return prevNodes;
      }

      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
      );
    });
  }, []);

  const value = React.useMemo(() => ({
    nodes,
    edges,
    setNodes,
    setEdges,
    updateNodePosition,
  }), [nodes, edges, setNodes, setEdges, updateNodePosition]);

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};
