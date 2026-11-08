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

  // Keep a stable ref to onStateChange to avoid re-triggering synchronization
  // effects or resetting debounce timers when consumer passes an inline function.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Keep refs for pending sync state so we can flush on unmount
  const pendingStateRef = useRef(null);

  // Performance Optimization: Debounce state synchronization (150ms).
  // Interactive operations like dragging nodes trigger rapid state updates (~60fps).
  // Debouncing reduces expensive external notifications / network sync calls from
  // dozens per second to just one per pause or on unmount.
  useEffect(() => {
    if (!autoSync) return;

    pendingStateRef.current = { nodes, edges };

    const timer = setTimeout(() => {
      if (syncCallbackRef.current && pendingStateRef.current) {
        syncCallbackRef.current(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes, edges, autoSync]);

  // Flush pending updates when unmounting so zero data is lost
  useEffect(() => {
    return () => {
      if (pendingStateRef.current && syncCallbackRef.current) {
        syncCallbackRef.current(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    };
  }, []);

  // Performance Optimization: Guard against redundant position updates.
  // If coordinates have not changed or node does not exist, return existing state
  // reference (`prevNodes`) to bail out and avoid React re-renders.
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
