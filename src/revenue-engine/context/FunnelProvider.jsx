import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

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

  // Performance Optimization: Cache latest callback to prevent effect re-runs on function identity changes
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Keep track of latest state for unmount flushing and debouncing
  const latestStateRef = useRef({ nodes, edges });
  useEffect(() => {
    latestStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  // Performance Optimization: Debounce autoSync updates (150ms) to prevent flooding
  // external callbacks/analytics during high-frequency interactions (e.g. dragging nodes at 60fps).
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes, edges, autoSync]);

  // Flush pending state on unmount if autoSync is active to ensure zero data loss
  useEffect(() => {
    return () => {
      if (autoSync && syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    };
  }, [autoSync]);

  // Performance Optimization: Equality guard to skip state updates and subsequent
  // re-renders if node coordinates haven't changed or if the node is not present.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((n) => n.id === id);
      if (nodeIndex === -1) {
        return prevNodes;
      }
      const currentNode = prevNodes[nodeIndex];
      if (currentNode.position.x === nextX && currentNode.position.y === nextY) {
        return prevNodes; // Bail out to avoid triggering React reconciliation
      }

      const newNodes = [...prevNodes];
      newNodes[nodeIndex] = {
        ...currentNode,
        position: { x: nextX, y: nextY },
      };
      return newNodes;
    });
  }, []);

  const value = useMemo(
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
