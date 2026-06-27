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

  // Optimization: Debounce onStateChange to prevent excessive calls during high-frequency updates (e.g. dragging)
  const callbackRef = useRef(onStateChange);

  useEffect(() => {
    callbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!autoSync || !callbackRef.current) return;

    const handler = setTimeout(() => {
      if (callbackRef.current) {
        callbackRef.current({ nodes, edges });
      }
    }, 150); // 150ms debounce for performance balance

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
