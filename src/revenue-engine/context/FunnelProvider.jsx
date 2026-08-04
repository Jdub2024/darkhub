import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  const syncCallbackRef = React.useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce the external state synchronization callback
  // triggered by high-frequency events (like dragging) to reduce overhead from
  // potential expensive external operations. A debounce time of 150ms batches these updates.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const handler = setTimeout(() => {
      // Safe execution check: verify callback ref is still defined
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(handler);
    };
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement an equality guard to check if coordinates changed,
  // and search for the node index. Returning the exact same array reference (prevNodes)
  // allows React to bail out of the state update entirely and avoid unnecessary re-renders.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetIndex = prevNodes.findIndex((node) => node.id === id);
      if (targetIndex === -1) {
        return prevNodes; // Node not found, bail out
      }

      const targetNode = prevNodes[targetIndex];
      // Check if position coordinates actually changed
      if (targetNode.position.x === nextX && targetNode.position.y === nextY) {
        return prevNodes; // No position change, bail out
      }

      // Only update the target node to keep structural sharing
      const nextNodes = [...prevNodes];
      nextNodes[targetIndex] = {
        ...targetNode,
        position: { x: nextX, y: nextY },
      };
      return nextNodes;
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
