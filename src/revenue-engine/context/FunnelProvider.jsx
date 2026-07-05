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

  // Performance Optimization: Debounce the external sync callback to prevent
  // high-frequency state updates (e.g. during drag) from blocking the main thread.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timeoutId = setTimeout(() => {
      syncCallbackRef.current({ nodes, edges });
    }, 150); // 150ms debounce window

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: State update bail-out.
  // Skip state updates if the node hasn't actually moved to avoid unnecessary re-renders.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex(n => n.id === id);
      if (nodeIndex === -1) return prevNodes;

      const node = prevNodes[nodeIndex];
      if (node.position.x === nextX && node.position.y === nextY) {
        return prevNodes; // Bail out: identical state
      }

      const updatedNodes = [...prevNodes];
      updatedNodes[nodeIndex] = {
        ...node,
        position: { x: nextX, y: nextY }
      };
      return updatedNodes;
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
