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

  // Keep the callback ref up to date to prevent effect re-triggering when the callback reference changes.
  // This avoids callback starvation or redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Debounce the state synchronization callback (150ms) when autoSync is enabled.
  // This batches high-frequency updates (e.g., during 60fps drag operations) into a single external synchronization call.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timeoutId = setTimeout(() => {
      // Safe execution check to prevent execution of potentially nullified or stale callbacks
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement state update bail-out by returning the existing state
  // reference (prevNodes) if no changes are detected or if the node is not found.
  // This allows React to skip reconciliation/rendering for the entire tree under the provider.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((n) => n.id === id);

      // If the node is not found, or its coordinates are already identical,
      // return the existing state reference to trigger React's state bail-out.
      if (!targetNode || (targetNode.position.x === nextX && targetNode.position.y === nextY)) {
        return prevNodes;
      }

      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
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
