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

  // Optimization: Store latest callback in ref to prevent effect re-runs if it changes
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Optimization: Debounce state synchronization to reduce overhead during high-frequency updates (e.g. dragging)
  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      const timer = setTimeout(() => {
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === id);
      // Performance Pattern: Return existing state reference if no actual change detected
      if (!node || (node.position.x === nextX && node.position.y === nextY)) {
        return prevNodes;
      }
      return prevNodes.map((n) =>
        n.id === id ? { ...n, position: { x: nextX, y: nextY } } : n
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
