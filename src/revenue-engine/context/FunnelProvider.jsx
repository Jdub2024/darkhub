import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

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

  // Performance Optimization: Store latest onStateChange callback in a ref to prevent effect re-subscriptions or timer resets when onStateChange reference changes
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce autoSync state synchronization (150ms timeout) during rapid operations (e.g. dragging nodes)
  // to reduce external sync callback invocations from ~60fps to 1 batched update
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Equality guard in updateNodePosition to bail out
  // and preserve previous array reference if coordinates haven't changed or target node is missing
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((n) => n.id === id);
      if (!targetNode || (targetNode.position.x === nextX && targetNode.position.y === nextY)) {
        return prevNodes;
      }
      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
      );
    });
  }, []);

  const value = useMemo(() => ({
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
