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

  // Store the latest onStateChange callback in a ref to avoid effect re-execution
  // when callback reference changes (prevents callback starvation and unnecessary timer resets).
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Track mount status and latest state for flushing pending sync on unmount
  const isMountedRef = useRef(true);
  const latestStateRef = useRef({ nodes, edges });

  useEffect(() => {
    latestStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Performance Optimization: Debounce external state synchronization by 150ms.
  // During high-frequency interactions (like node dragging at 60fps), this batches
  // multiple state updates into a single onStateChange call to prevent network/sync overhead.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    let hasFired = false;
    const timer = setTimeout(() => {
      hasFired = true;
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      // If unmounting before timer fired, flush latest state to prevent data loss
      if (!isMountedRef.current && !hasFired && syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    };
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement state update bail-out in updateNodePosition.
  // Returning the existing prevNodes reference if no node is found or if position
  // coordinates remain unchanged skips state updates and avoids re-rendering the tree.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((node) => node.id === id);
      if (nodeIndex === -1) return prevNodes;

      const targetNode = prevNodes[nodeIndex];
      if (targetNode.position?.x === nextX && targetNode.position?.y === nextY) {
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

  const value = React.useMemo(
    () => ({
      nodes,
      edges,
      setNodes,
      setEdges,
      updateNodePosition,
    }),
    [nodes, edges, setNodes, setEdges, updateNodePosition]
  );

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};
