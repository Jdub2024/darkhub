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

  const syncCallbackRef = useRef(onStateChange);

  // Performance Optimization: Keep ref up to date to avoid re-triggering the debounced sync effect when onStateChange reference changes
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce state synchronization callback (150ms) to batch high-frequency updates (e.g., during dragging)
  useEffect(() => {
    if (!autoSync) return;

    const handler = setTimeout(() => {
      // Safe execution check: prevent execution of potentially nullified or stale callbacks
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: State update bail-out with equality guard to skip unnecessary re-renders if the position is unchanged
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === id);
      if (!targetNode) return prevNodes; // Bail out if node is not found

      // Equality guard: if coordinates haven't changed, return original state reference to bail out of render reconciliation
      if (targetNode.position.x === nextX && targetNode.position.y === nextY) {
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
