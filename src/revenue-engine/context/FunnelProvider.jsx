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

  // Performance Optimization: Use a ref for onStateChange to prevent unnecessary effect execution
  // and avoid "callback starvation" or redundant timer resets when onStateChange reference changes.
  const syncCallbackRef = useRef(onStateChange);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce state synchronization to 150ms
  // This batches high-frequency updates (e.g., node dragging at 60fps) to a single callback invocation.
  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      const timer = setTimeout(() => {
        // Safe execution check to prevent running if the callback is nullified or stale
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement a state update bail-out with equality guards.
  // Returning the existing state reference (prevNodes) allows React to skip reconciliation completely
  // if coordinates have not changed or if the node isn't found.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === id);
      if (!node) return prevNodes;

      // Equality guard: skip updates if the position hasn't changed
      if (node.position.x === nextX && node.position.y === nextY) {
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
