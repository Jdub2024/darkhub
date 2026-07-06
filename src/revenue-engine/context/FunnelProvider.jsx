import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

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

  // Performance: Keep a ref to the latest callback to avoid unnecessary effect restarts
  // when the parent component provides a new function reference on every render.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance: Debounce external state synchronization (150ms) to optimize high-frequency events (like dragging).
  // This batches updates and reduces overhead from potential expensive operations in onStateChange.
  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      const handler = setTimeout(() => {
        syncCallbackRef.current({ nodes, edges });
      }, 150);
      return () => clearTimeout(handler);
    }
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id === id) {
          // Performance: Equality guard to skip updates if position hasn't actually changed.
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          changed = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });

      // Performance: Bail-out pattern - return existing state reference if no nodes were updated.
      // This allows React to skip the reconciliation process for the entire provider and consumer tree.
      return changed ? nextNodes : prevNodes;
    });
  }, []);

  const value = useMemo(() => ({
    nodes,
    edges,
    setNodes,
    setEdges,
    updateNodePosition,
  }), [nodes, edges, updateNodePosition]);

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};
