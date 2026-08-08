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

  // Performance Pattern: Use useRef to store the latest callback to prevent callback starvation
  // and redundant timer resets during high-frequency dragging updates.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce external state synchronization (150ms) to prevent high-frequency
  // updates (e.g., node dragging at 60fps) from hammering downstream consumers or API endpoints.
  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      const handler = setTimeout(() => {
        // Performance Pattern: Safe execution check to prevent executing a stale or nullified callback
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150);

      return () => clearTimeout(handler);
    }
  }, [nodes, edges, autoSync]);

  // Performance Pattern: State update bail-out / equality guard.
  // If the coordinates haven't changed, we return the existing node (instead of recreating it).
  // Furthermore, if no actual position changes occurred across any node, we return the exact same
  // prevNodes reference to let React bail out of reconciliation entirely, bypassing any tree re-renders.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id === id) {
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          changed = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });
      return changed ? nextNodes : prevNodes;
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
