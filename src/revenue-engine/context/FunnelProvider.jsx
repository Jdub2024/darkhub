import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

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

  // Performance Optimization: Keep latest callback reference to prevent debounce resets
  // if consumer re-creates onStateChange callback reference across renders.
  const syncCallbackRef = useRef(onStateChange);
  const pendingStateRef = useRef({ nodes, edges });
  const hasPendingRef = useRef(false);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce external state synchronization (150ms).
  // High-frequency interactions like dragging fire updates at ~60fps; debouncing batches
  // these updates and reduces synchronization callbacks by >95%, preventing I/O starvation.
  useEffect(() => {
    pendingStateRef.current = { nodes, edges };
    if (!autoSync) return;

    hasPendingRef.current = true;
    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
      hasPendingRef.current = false;
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Synchronously flush pending state on unmount to ensure zero data loss.
  useEffect(() => {
    return () => {
      if (hasPendingRef.current && autoSync && syncCallbackRef.current) {
        syncCallbackRef.current(pendingStateRef.current);
      }
    };
  }, [autoSync]);

  // Performance Optimization: Equality guard & state bail-out.
  // Returning the existing prevNodes reference when coordinates match or node is missing
  // allows React to completely skip the reconciliation phase and prevent child re-renders.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === id);
      if (!targetNode || (targetNode.position.x === nextX && targetNode.position.y === nextY)) {
        return prevNodes;
      }
      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
      );
    });
  }, []);

  const value = useMemo(() => ({
    nodes,
    edges,
    setNodes,
    setEdges,
    updateNodePosition,
  }), [nodes, edges, updateNodePosition]);

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};
