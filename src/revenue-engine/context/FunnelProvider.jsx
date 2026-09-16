import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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

  // Store latest onStateChange callback in a ref to avoid resetting debounce timers on parent re-renders
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce autoSync state synchronization callbacks (150ms)
  // High-frequency state updates like node dragging trigger onStateChange repeatedly.
  // Debouncing reduces expensive external API / analytics calls and re-renders from 60fps to 1 call after interaction stops.
  useEffect(() => {
    if (!autoSync) return;

    const handler = setTimeout(() => {
      if (onStateChangeRef.current) {
        onStateChangeRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
      )
    );
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
