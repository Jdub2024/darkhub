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

  // Performance Optimization: Debounce the onStateChange callback to prevent
  // excessive synchronization overhead during high-frequency events like dragging.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timeoutId = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150); // 150ms debounce window

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      // Performance Optimization: Equality guard to skip state updates
      // if coordinates haven't actually changed.
      const targetNode = prevNodes.find(n => n.id === id);
      if (targetNode && targetNode.position.x === nextX && targetNode.position.y === nextY) {
        return prevNodes;
      }

      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
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
