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

  // Performance Pattern: Store the latest callback reference in a ref.
  // This avoids restarting/thrashing the debounce timer whenever the callback identity changes.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce high-frequency state updates (e.g., node dragging at 60fps)
  // to prevent external callbacks (like parent renders or API syncs) from starving the CPU.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance Pattern: Equality guard to skip state updates and subsequent re-renders
  // if coordinate values haven't actually changed or the target node was not found.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let hasChanged = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id === id) {
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          hasChanged = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });
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
