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

  // Performance Optimization: Use useRef to store the latest onStateChange callback.
  // This prevents the debounced sync effect from re-running and resetting the timer
  // unnecessarily when the parent component provides a new unmemoized callback reference.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce the external state synchronization callback
  // with a 150ms delay. This prevents high-frequency updates (e.g., at 60fps during node dragging)
  // from spamming the external callback and overwhelming analytics or storage sync operations.
  useEffect(() => {
    if (!autoSync || !onStateChange) return;

    const handler = setTimeout(() => {
      // Safe execution check to prevent invoking a stale or nullified callback
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement state update bail-out (equality guard).
  // Searching for the node and checking if its coordinates have actually changed
  // avoids creating a new array/node object references when no change occurs.
  // Returning the existing prevNodes reference allows React to skip re-rendering the tree.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((node) => node.id === id);
      if (nodeIndex === -1) return prevNodes;

      const targetNode = prevNodes[nodeIndex];
      if (targetNode.position.x === nextX && targetNode.position.y === nextY) {
        return prevNodes;
      }

      const updatedNodes = [...prevNodes];
      updatedNodes[nodeIndex] = {
        ...targetNode,
        position: { x: nextX, y: nextY },
      };
      return updatedNodes;
    });
  }, []);

  // Performance Optimization: Memoize context values using useMemo to prevent
  // unnecessary re-renders of the consumer tree when the provider's parents re-render.
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
