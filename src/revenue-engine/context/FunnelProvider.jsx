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

  // Performance Pattern: Use a useRef to store the latest callback function.
  // This prevents the effect from re-running unnecessarily if the callback reference changes,
  // avoiding 'callback starvation' or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!autoSync) return;

    // Performance Optimization: Debounce external state synchronization callbacks triggered by
    // high-frequency events (like dragging) to reduce overhead from potential expensive operations.
    // Batch updates using a 150ms timeout.
    const timer = setTimeout(() => {
      // Performance Pattern: Safe execution check inside the debounced setTimeout
      // to prevent execution of potentially nullified or stale callbacks.
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((node) => node.id === id);
      if (nodeIndex === -1) return prevNodes;

      const node = prevNodes[nodeIndex];
      // Performance Pattern: Implement equality guards to skip state updates
      // and subsequent re-renders if the data (like coordinate values) has not actually changed.
      // Returning the existing state reference (prevNodes) allows React to skip reconciliation.
      if (node.position.x === nextX && node.position.y === nextY) {
        return prevNodes;
      }

      const nextNodes = [...prevNodes];
      nextNodes[nodeIndex] = { ...node, position: { x: nextX, y: nextY } };
      return nextNodes;
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
