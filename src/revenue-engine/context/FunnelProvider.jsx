import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  const syncCallbackRef = React.useRef(onStateChange);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce the onStateChange synchronization
  // to avoid blocking the main thread during high-frequency updates (e.g., dragging).
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const handler = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeToUpdate = prevNodes.find(n => n.id === id);

      // Optimization: Bail out if position hasn't changed to prevent unnecessary re-renders
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
