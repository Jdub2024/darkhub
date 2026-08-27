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

  // Performance optimization: Store the onStateChange callback in a ref to prevent
  // the sync effect from resetting timers unnecessarily when onStateChange reference changes.
  const syncCallbackRef = React.useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance optimization: Debounce autoSync updates (150ms delay) to batch high-frequency
  // state changes (like continuous drag events) into a single external synchronization call.
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance optimization: Equality guard on updateNodePosition.
  // Returns existing prevNodes reference if position is unchanged or node not found,
  // preventing unnecessary React state updates and component re-renders during dragging.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === id);
      if (!targetNode || (targetNode.position.x === nextX && targetNode.position.y === nextY)) {
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
