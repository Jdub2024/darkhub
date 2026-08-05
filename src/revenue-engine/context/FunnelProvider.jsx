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

  // Performance Optimization: Use a ref to keep the latest onStateChange callback reference.
  // This prevents the sync effect from re-running unnecessarily when onStateChange reference changes,
  // avoiding 'callback starvation' or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce external state synchronization (150ms) triggered
  // by high-frequency events (like node dragging) to reduce overhead from potentially expensive operations.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timer = setTimeout(() => {
      // Safe execution check: ensure the callback exists before executing
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: State update bail-out in updateNodePosition.
  // It returns the existing state reference (prevNodes) if the node index is not found,
  // or if coordinates have not actually changed (equality guards). This allows React to skip
  // reconciliation and re-rendering for the entire tree under high-frequency updates.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((node) => node.id === id);
      if (nodeIndex === -1) {
        return prevNodes;
      }
      const node = prevNodes[nodeIndex];
      if (node.position.x === nextX && node.position.y === nextY) {
        return prevNodes;
      }

      const nextNodes = [...prevNodes];
      nextNodes[nodeIndex] = {
        ...node,
        position: { x: nextX, y: nextY },
      };
      return nextNodes;
    });
  }, []);

  // Performance Optimization: Memoize context value using useMemo to prevent unnecessary
  // re-renders of the entire consumer tree when provider is re-rendered due to unrelated prop updates.
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
