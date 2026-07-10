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

  const syncCallbackRef = useRef(onStateChange);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      // Performance Optimization: Debounce state synchronization (150ms)
      // Prevents high-frequency events (like dragging) from overwhelming external listeners.
      syncTimeoutRef.current = setTimeout(() => {
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      // Performance Optimization: Equality guard to prevent redundant state updates
      // during high-frequency drag events if coordinates haven't changed.
      const nodeToUpdate = prevNodes.find((n) => n.id === id);
      if (nodeToUpdate && nodeToUpdate.position.x === nextX && nodeToUpdate.position.y === nextY) {
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
