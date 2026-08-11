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

  // PERFORMANCE OPTIMIZATION:
  // Store latest onStateChange callback in a ref to avoid recreating the debounced sync effect
  // when the reference to onStateChange changes. This prevents redundant timer resets.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // PERFORMANCE OPTIMIZATION:
  // Debounce the state synchronization callback (150ms) to significantly reduce the overhead
  // of high-frequency events (e.g., node dragging during UI interactions) triggering expensive
  // external synchronization handlers (onStateChange).
  useEffect(() => {
    if (!autoSync) return;

    const handler = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  // PERFORMANCE OPTIMIZATION:
  // Implement state update bail-out by ensuring state references are preserved if
  // coordinates have not changed or if the target node does not exist.
  // This helps React skip reconciliation on the entire tree.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        if (node.id === id) {
          if (node.position?.x === nextX && node.position?.y === nextY) {
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
