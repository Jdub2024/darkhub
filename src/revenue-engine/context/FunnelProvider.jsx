import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

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

  // Performance Optimization: Cache latest callback to prevent effect re-runs when callback reference changes
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Keep ref to latest state for unmount synchronization
  const latestStateRef = useRef({ nodes, edges });
  useEffect(() => {
    latestStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  // Track pending sync to flush accurately on unmount
  const hasPendingSyncRef = useRef(false);

  // Performance Optimization: Debounce state synchronization (150ms)
  // High-frequency dragging events emit updates at ~60fps; debouncing reduces external sync/re-render load
  useEffect(() => {
    if (!autoSync || !onStateChangeRef.current) return;

    hasPendingSyncRef.current = true;
    const timer = setTimeout(() => {
      hasPendingSyncRef.current = false;
      if (onStateChangeRef.current) {
        onStateChangeRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes, edges, autoSync]);

  // Flush pending updates when unmounting so no state changes are lost
  useEffect(() => {
    return () => {
      if (autoSync && hasPendingSyncRef.current && onStateChangeRef.current) {
        onStateChangeRef.current(latestStateRef.current);
      }
    };
  }, [autoSync]);

  // Performance Optimization: Equality check and bail-out to skip state updates when position is unchanged
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let changed = false;
      const updatedNodes = prevNodes.map((node) => {
        if (node.id === id) {
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          changed = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });

      // Returning original state reference skips React reconciliation and re-rendering
      return changed ? updatedNodes : prevNodes;
    });
  }, []);

  const value = useMemo(() => ({
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
