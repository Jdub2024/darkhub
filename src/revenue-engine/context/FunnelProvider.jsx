import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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

  // Performance Optimization:
  // Store latest onStateChange callback in a ref to avoid re-triggering the debounce effect
  // when an unmemoized callback prop is passed by parent components.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Keep a ref of latest nodes/edges for flushing state synchronously on unmount
  const latestStateRef = useRef({ nodes, edges });
  latestStateRef.current = { nodes, edges };

  // Performance Optimization: Debounce onStateChange sync calls during continuous interactions (e.g. dragging)
  // Reduces sync calls from ~60fps down to 1 call per settled interaction (150ms debounce).
  // On unmount, flushes pending state immediately to prevent data loss.
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Flush pending updates when unmounting if autoSync is active
  useEffect(() => {
    return () => {
      if (autoSync && syncCallbackRef.current) {
        syncCallbackRef.current(latestStateRef.current);
      }
    };
  }, [autoSync]);

  // Performance Optimization: Bail out of state update if the node coordinates are identical
  // or if the target node doesn't exist, preventing unnecessary tree re-renders.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const nodeIndex = prevNodes.findIndex((n) => n.id === id);
      if (nodeIndex === -1) return prevNodes;

      const currentNode = prevNodes[nodeIndex];
      if (
        currentNode.position &&
        currentNode.position.x === nextX &&
        currentNode.position.y === nextY
      ) {
        return prevNodes;
      }

      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
      );
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
