import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

export const FunnelContext = createContext();

export const useFunnel = () => {
  const context = useContext(FunnelContext);
  if (!context) {
    throw new Error('useFunnel must be used within a FunnelProvider');
  }
  return context;
};

// Debounce delay in milliseconds for syncing state updates to external consumers
const DEBOUNCE_DELAY_MS = 150;

export const FunnelProvider = ({
  children,
  initialNodes = [],
  initialEdges = [],
  onStateChange,
  autoSync = false,
}) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // Store latest onStateChange callback in a ref to avoid resetting timers if callback reference changes
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Performance optimization: Debounce external state synchronization (150ms) to batch high-frequency
  // drag events (e.g., 60fps pointer movements) into a single callback invocation.
  // Flushes pending updates synchronously on unmount to prevent data loss.
  useEffect(() => {
    if (!autoSync) return;

    let hasFired = false;
    const timer = setTimeout(() => {
      hasFired = true;
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, DEBOUNCE_DELAY_MS);

    return () => {
      clearTimeout(timer);
      if (!isMountedRef.current && !hasFired && syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    };
  }, [nodes, edges, autoSync]);

  // Performance optimization: Implement equality guard to bail out of state updates if position
  // has not changed or node does not exist. Returning prevNodes skips reconciliation and re-rendering.
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

  // Memoize context value to prevent unnecessary re-renders of consuming components
  const value = useMemo(() => ({
    nodes,
    edges,
    setNodes,
    setEdges,
    updateNodePosition,
  }), [nodes, edges, updateNodePosition]);

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};
