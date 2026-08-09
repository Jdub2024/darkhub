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

  // Performance Pattern: Use useRef to store the latest callback to avoid resetting the debounce timer on onStateChange reference change.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Pattern: Debounce the external state synchronization (150ms) to batch high-frequency updates during node dragging.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const handler = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => {
      clearTimeout(handler);
    };
  }, [nodes, edges, autoSync]);

  // Performance Pattern: Implement state update bail-out by returning the existing state reference (prevNodes) if no changes are detected or if the node is not found.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      let changed = false;
      const updatedNodes = prevNodes.map((node) => {
        if (node.id === id) {
          if (node.position.x === nextX && node.position.y === nextY) {
            return node;
          }
          changed = true;
          return { ...node, position: { x: nextX, y: nextY } };
        }
        return node;
      });

      // If no change occurred (same coordinates or node not found), bail out and return original reference
      return changed ? updatedNodes : prevNodes;
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
