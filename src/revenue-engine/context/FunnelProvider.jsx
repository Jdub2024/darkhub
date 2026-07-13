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
  const syncCallbackRef = useRef(onStateChange);
  const debounceTimerRef = useRef(null);

  // Update ref to latest callback to avoid closure staleness
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance: Debounce external state synchronization (150ms)
  // to reduce overhead during high-frequency events like node dragging.
  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((n) => n.id === id);
      if (nodeIndex === -1) return prevNodes;

      const node = prevNodes[nodeIndex];
      // Performance: Skip state update if coordinates haven't changed.
      // This prevents unnecessary re-renders of the entire node/edge tree.
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
