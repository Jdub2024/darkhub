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

  // Performance Optimization: Use a ref for the external callback to prevent
  // timer resets and callback starvation when onStateChange changes.
  const syncCallbackRef = useRef(onStateChange);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce state synchronization to avoid
  // redundant and high-frequency external state syncs (e.g., during node dragging).
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      // Safe execution check to prevent calling stale or nullified callbacks
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement state update bail-out / equality guard
  // by returning the unchanged `prevNodes` reference if the node coordinate has
  // not actually changed or if the node is not found. This allows React to skip
  // reconciliation and rendering for the entire component tree.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === id);
      if (!targetNode) return prevNodes;

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
