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

  // Performance optimization: Keep a ref to the sync callback to prevent the
  // debouncing useEffect from re-running (callback starvation) when onStateChange changes.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance optimization: Debounce external callback synchronization (150ms delay)
  // to avoid blocking the main thread during high-frequency dragging/updates.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timeoutId = setTimeout(() => {
      // Safe execution check inside the debounced setTimeout to prevent execution of stale/nullified callbacks
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, autoSync]);

  // Performance optimization: Implement state update bail-out by returning the existing state reference
  // if no changes in position are detected or if the node is not found, skipping unnecessary React reconciliation.
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
