import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  useEffect(() => {
    if (autoSync && onStateChange) {
      onStateChange({ nodes, edges });
    }
  }, [nodes, edges, autoSync, onStateChange]);

  // Performance Optimization: Check equality before updating state. Returning existing state reference (`prevNodes`)
  // when node is not found or position is unchanged allows React to bail out of state updates, skipping re-renders.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === id);
      if (!node || (node.position.x === nextX && node.position.y === nextY)) {
        return prevNodes;
      }
      return prevNodes.map((n) =>
        n.id === id ? { ...n, position: { x: nextX, y: nextY } } : n
      );
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
