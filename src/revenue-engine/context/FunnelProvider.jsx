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
      // Optimization: Debounce external state sync to prevent sync overhead during high-frequency drag events
      const syncTimeout = setTimeout(() => {
        onStateChange({ nodes, edges });
      }, 100);

      return () => clearTimeout(syncTimeout);
    }
  }, [nodes, edges, autoSync, onStateChange]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((n) => n.id === id);
      if (nodeIndex === -1) return prevNodes;

      const node = prevNodes[nodeIndex];
      // Optimization: Skip state update if position hasn't changed (e.g. redundant events)
      if (node.position.x === nextX && node.position.y === nextY) {
        return prevNodes;
      }

      const newNodes = [...prevNodes];
      newNodes[nodeIndex] = {
        ...node,
        position: { x: nextX, y: nextY },
      };
      return newNodes;
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
