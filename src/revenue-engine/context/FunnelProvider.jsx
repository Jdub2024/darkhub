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

  // Performance Optimization: Use a useRef to store the latest callback.
  // This avoids callback starvation or re-running the effect unnecessarily
  // when the callback function reference changes.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce the external state changes
  // to prevent frequent network/re-render storms during high-frequency events
  // like dragging nodes (e.g. at 60fps).
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150); // 150ms debounce window

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement an equality guard in state updates.
  // Returns existing nodes state reference (`prevNodes`) if the coordinate positions
  // or node targets do not change. This allows React to bail out of state updates
  // and completely avoid subsequent reconciliation and re-rendering of children.
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
