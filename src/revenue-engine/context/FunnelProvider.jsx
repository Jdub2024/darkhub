import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

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

  // Maintain callback ref to prevent debounce reset when onStateChange inline ref changes
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Track latest nodes and edges for unmount flush
  const latestStateRef = useRef({ nodes, edges });
  useEffect(() => {
    latestStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  // Track mount status to flush pending updates on unmount without data loss
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Performance Optimization: Debounce state synchronization (150ms) during high-frequency
  // operations (such as dragging canvas nodes at 60fps) to prevent redundant sync calls.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      // Flush latest pending state on unmount if timer was pending
      if (!isMountedRef.current && autoSync && syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    };
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Equality guard to skip state updates and prevent unnecessary re-renders
  // if position coordinates haven't changed or if the node is not found.
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
  }), [nodes, edges, updateNodePosition]);

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};
