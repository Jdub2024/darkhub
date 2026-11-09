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

  // Performance Optimization: Cache onStateChange callback in a ref to prevent effect
  // re-runs when callback reference changes, avoiding callback starvation or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce synchronization (150ms) to coalesce rapid
  // high-frequency drag events (up to 60fps) into a single callback, drastically reducing overhead.
  // On unmount, flush any pending debounced state synchronously using isMountedRef.
  const isMountedRef = useRef(true);
  const pendingStateRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    pendingStateRef.current = { nodes, edges };

    const handler = setTimeout(() => {
      if (syncCallbackRef.current && pendingStateRef.current) {
        syncCallbackRef.current(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    }, 150);

    return () => {
      clearTimeout(handler);
      // Flush synchronously if component is unmounting to avoid data loss
      if (!isMountedRef.current && syncCallbackRef.current && pendingStateRef.current) {
        syncCallbackRef.current(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    };
  }, [nodes, edges, autoSync]);

  // Performance Optimization: State update bail-out with equality guards.
  // Returns existing prevNodes reference if coordinates are unchanged or node is not found,
  // allowing React to completely skip reconciliation and re-rendering for consumer components.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetIndex = prevNodes.findIndex((node) => node.id === id);
      if (targetIndex === -1) return prevNodes;

      const currentNode = prevNodes[targetIndex];
      if (currentNode.position.x === nextX && currentNode.position.y === nextY) {
        return prevNodes;
      }

      const updatedNodes = [...prevNodes];
      updatedNodes[targetIndex] = {
        ...currentNode,
        position: { x: nextX, y: nextY },
      };
      return updatedNodes;
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
