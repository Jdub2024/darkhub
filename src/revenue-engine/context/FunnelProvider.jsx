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

  const syncCallbackRef = useRef(onStateChange);

  // Keep the callback ref up-to-date to avoid re-triggering the main synchronization effect on identity changes
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce external state synchronization callbacks (like onStateChange)
  // triggered by high-frequency events (like dragging) to reduce overhead from potential expensive operations.
  useEffect(() => {
    if (autoSync) {
      const timer = setTimeout(() => {
        // Performance Pattern: In FunnelProvider.jsx, a safe execution check (if (syncCallbackRef.current))
        // is included inside the debounced setTimeout to prevent execution of potentially nullified or stale callbacks.
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150); // 150ms delay for debounced synchronization

      return () => clearTimeout(timer);
    }
  }, [nodes, edges, autoSync]);

  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let hasChanged = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id === id) {
          // Performance Pattern: Implement equality guards to skip coordinate updates if coordinates haven't changed.
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          hasChanged = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });
      // Performance Pattern: State update bail-out by returning existing state reference (prevNodes)
      // if no changes are detected or if the node is not found. This allows React to skip reconciliation of the entire tree.
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
