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

  // Performance: Use ref to track the latest callback to avoid effect re-runs
  // if the parent component provides an unstable function reference.
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Performance: Debounce synchronization to avoid excessive overhead during
  // high-frequency events like node dragging.
  useEffect(() => {
    if (!autoSync || !onStateChangeRef.current) return;

    const handler = setTimeout(() => {
      onStateChangeRef.current({ nodes, edges });
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((n) => n.id === id);
      if (nodeIndex === -1) return prevNodes;

      const node = prevNodes[nodeIndex];
      // Performance: Equality guard to skip state update if coordinates haven't changed.
      // If no change, return the original array reference to allow React to bail out of rendering.
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
