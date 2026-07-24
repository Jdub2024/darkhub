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

  // Performance Pattern: Use a useRef to store the latest callback function.
  // This prevents the effect from re-running unnecessarily if the callback reference changes,
  // avoiding 'callback starvation' or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce the external state synchronization callback (150ms)
  // triggered by high-frequency events (like node dragging) to reduce overhead and batch updates.
  useEffect(() => {
    if (!autoSync) return;

    const handler = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  // Performance Pattern: Implement state update bail-out by returning the existing state
  // reference (prevNodes) if coordinate values have not changed.
  // This skips unnecessary re-renders of the node system and prevents React reconciliation.
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
