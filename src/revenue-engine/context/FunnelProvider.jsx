import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

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

  // Performance Pattern: Store the latest callback in a ref to avoid triggering the
  // main effect on every parent render or callback reference change, eliminating callback starvation.
  const syncCallbackRef = useRef(onStateChange);

  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce state synchronization callbacks to prevent excessive
  // downstream updates / re-renders during high-frequency events such as dragging nodes.
  useEffect(() => {
    if (autoSync && syncCallbackRef.current) {
      const timer = setTimeout(() => {
        if (syncCallbackRef.current) {
          syncCallbackRef.current({ nodes, edges });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [nodes, edges, autoSync]);

  // Performance Pattern: Implement an equality guard state update bailout. If coordinates
  // have not changed, we return the existing state reference, preventing unnecessary React re-renders.
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

  const value = useMemo(() => ({
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
