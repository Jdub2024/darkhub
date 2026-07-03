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

  // Use a ref to store the latest onStateChange callback.
  // This prevents the synchronization effect from re-running unnecessarily
  // if the parent component provides an unstable (anonymous) function.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce the external onStateChange call.
  // High-frequency events like node dragging should not trigger expensive
  // external synchronization (e.g., API calls or heavy analytics) on every pixel move.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const handler = setTimeout(() => {
      syncCallbackRef.current({ nodes, edges });
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let hasChanged = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id === id) {
          // Equality guard: if coordinates haven't actually changed, return existing node reference.
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          hasChanged = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });

      // If no nodes were updated, return the original array reference to skip re-render.
      return hasChanged ? nextNodes : prevNodes;
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
