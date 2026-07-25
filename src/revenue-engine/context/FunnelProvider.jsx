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

  // Performance Pattern: Use useRef to store the latest external sync callback reference.
  // This prevents the debouncing effect from re-running/resetting timers unnecessarily
  // if the callback reference changes on every render of the parent.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce external state synchronization callbacks (150ms delay)
  // triggered by high-frequency events (like node dragging or dragging coordinate changes).
  // This reduces the overhead and potential expensive operations from downstream consumers.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      // Performance Pattern: Implement an equality guard to avoid state updates and
      // unnecessary re-renders when the coordinates have not changed, or if the node is not found.
      const nodeIndex = prevNodes.findIndex((node) => node.id === id);
      if (nodeIndex === -1) return prevNodes;

      const node = prevNodes[nodeIndex];
      if (node.position.x === nextX && node.position.y === nextY) {
        return prevNodes; // Return original array reference to skip state update/re-renders
      }

      const nextNodes = [...prevNodes];
      nextNodes[nodeIndex] = {
        ...node,
        position: { x: nextX, y: nextY },
      };
      return nextNodes;
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
