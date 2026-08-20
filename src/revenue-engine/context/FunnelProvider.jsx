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

  // Store latest onStateChange in ref to prevent callback starvation / unnecessary timer resets
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce autoSync synchronization (150ms) to prevent high-frequency
  // onStateChange calls during drag operations
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      if (onStateChangeRef.current) {
        onStateChangeRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Add coordinate equality guard to skip state update and re-renders if position is unchanged
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const existingNode = prevNodes.find((node) => node.id === id);
      if (
        existingNode &&
        existingNode.position.x === nextX &&
        existingNode.position.y === nextY
      ) {
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
