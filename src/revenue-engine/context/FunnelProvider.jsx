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

  // Performance Pattern: Use a ref to store the latest onStateChange callback.
  // This prevents the synchronization effect from re-running if the callback
  // reference changes, avoiding 'callback starvation' or redundant timer resets.
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce external state synchronization (150ms).
  // Reduces overhead from frequent state changes (e.g., node dragging)
  // that might trigger expensive external operations.
  useEffect(() => {
    if (autoSync && onStateChangeRef.current) {
      const handler = setTimeout(() => {
        onStateChangeRef.current({ nodes, edges });
      }, 150);

      return () => clearTimeout(handler);
    }
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === id) {
          // Performance Pattern: Equality guard.
          // Skip state updates and subsequent re-renders if coordinates haven't changed.
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      })
    );
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
