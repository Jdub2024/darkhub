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

  // Performance: Use a ref to store the latest onStateChange callback.
  // This prevents the effect from re-running if the callback reference changes,
  // avoiding 'callback starvation' or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      // Performance: Debounce external state synchronization (150ms)
      // to reduce overhead from high-frequency events like node dragging.
      const timer = setTimeout(() => {
        syncCallbackRef.current({ nodes, edges });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let hasChanged = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id !== id) return node;

        // Performance: Equality guard to skip creating a new object
        // if coordinates haven't changed.
        if (node.position.x === nextX && node.position.y === nextY) {
          return node;
        }

        hasChanged = true;
        return { ...node, position: { x: nextX, y: nextY } };
      });

      // Performance: If no node position changed, return the original array
      // reference to bail out of the state update and prevent re-renders.
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
