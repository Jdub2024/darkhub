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

  // Optimization: Keep a stable ref to onStateChange to avoid re-triggering debounce timers
  // when callback reference changes across renders.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Optimization: Debounce state synchronization (150ms) during high-frequency events (e.g. node dragging)
  // to avoid flooding consumers/analytics/persisted storage with dozens of calls per second.
  // Pending changes are flushed synchronously on unmount to prevent data loss.
  const latestStateRef = useRef({ nodes, edges });
  useEffect(() => {
    latestStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  const hasPendingSyncRef = useRef(false);

  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    hasPendingSyncRef.current = true;
    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
        hasPendingSyncRef.current = false;
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes, edges, autoSync]);

  // Flush pending changes on unmount if any are pending
  useEffect(() => {
    return () => {
      if (autoSync && hasPendingSyncRef.current && syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    };
  }, [autoSync]);

  // Optimization: Equality guard in updateNodePosition skips state update and re-render
  // if coordinates have not changed or if the node does not exist.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((node) => node.id === id);
      if (nodeIndex === -1) return prevNodes;

      const currentNode = prevNodes[nodeIndex];
      if (currentNode.position.x === nextX && currentNode.position.y === nextY) {
        return prevNodes;
      }

      const updatedNodes = [...prevNodes];
      updatedNodes[nodeIndex] = {
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
