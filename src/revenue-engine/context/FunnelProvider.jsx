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

  // Performance Optimization: Use a ref to store the latest callback.
  // This prevents the useEffect from re-triggering unnecessarily if onStateChange reference changes,
  // avoiding "callback starvation" or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce state synchronization callback (150ms).
  // This batches high-frequency updates (like node dragging) before executing onStateChange,
  // drastically reducing rendering overhead and external sync calls.
  useEffect(() => {
    if (!autoSync) return;

    const delayDebounceFn = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: State update bail-out.
  // We first check if the target node exists and if its coordinates have actually changed.
  // If no change is detected (or node is missing), we return the existing 'prevNodes' state reference.
  // This allows React to skip reconciliation and avoid triggering redundant re-renders of the component tree.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === id);
      if (!targetNode || (targetNode.position && targetNode.position.x === nextX && targetNode.position.y === nextY)) {
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
