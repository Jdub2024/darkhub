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

  // Performance Optimization: Use refs for sync callback, current state, and pending status to avoid
  // callback starvation and unnecessary effect re-runs when onStateChange reference changes.
  const syncCallbackRef = useRef(onStateChange);
  syncCallbackRef.current = onStateChange;

  const currentStateRef = useRef({ nodes, edges });
  currentStateRef.current = { nodes, edges };

  const isPendingSyncRef = useRef(false);

  // Performance Optimization: Debounce onStateChange notifications (150ms) to avoid
  // overwhelming external listeners/APIs during rapid operations (such as 60fps drag events).
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    isPendingSyncRef.current = true;
    const timer = setTimeout(() => {
      isPendingSyncRef.current = false;
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes, edges, autoSync]);

  // On unmount, flush any pending state synchronously to guarantee zero data loss.
  useEffect(() => {
    return () => {
      if (isPendingSyncRef.current && syncCallbackRef.current) {
        syncCallbackRef.current(currentStateRef.current);
      }
    };
  }, []);

  // Performance Optimization: Position equality guard bails out of state updates if the node
  // coordinates haven't changed or if the node is missing, returning the previous state reference
  // to avoid triggering reconciliation across all consumers.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((n) => n.id === id);
      if (!targetNode || (targetNode.position?.x === nextX && targetNode.position?.y === nextY)) {
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
