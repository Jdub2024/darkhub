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

  // Performance Optimization: Use a ref to store the latest onStateChange callback.
  // This prevents the debounce useEffect from re-running unnecessarily if the consumer
  // passes an anonymous or non-memoized callback function reference.
  const syncCallbackRef = useRef(onStateChange);
  useEffect(() => {
    syncCallbackRef.current = onStateChange;
  }, [onStateChange]);

  // Performance Optimization: Debounce the external onStateChange synchronization by 150ms.
  // Dragging nodes fires updates at up to 60fps, which can cause excessive parent updates
  // or heavy synchronous operations (like remote API sync or expensive calculations).
  // Debouncing reduces synchronization frequency to once per interaction burst.
  useEffect(() => {
    if (!autoSync || !syncCallbackRef.current) return;

    const handler = setTimeout(() => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current({ nodes, edges });
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [nodes, edges, autoSync]);

  // Performance Optimization: Implement state update bail-out inside setNodes map.
  // By checking if the target node exists and if its coordinates are actually different,
  // we can return the existing state reference (prevNodes) unchanged.
  // React detects this identical reference and skips reconciliation/re-render completely.
  const updateNodePosition = useCallback((id, nextX, nextY) => {
    setNodes((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === id);
      if (!targetNode) return prevNodes;

      // Equality guard: skip updates if the position hasn't changed.
      if (targetNode.position.x === nextX && targetNode.position.y === nextY) {
        return prevNodes;
      }

      return prevNodes.map((node) =>
        node.id === id ? { ...node, position: { x: nextX, y: nextY } } : node
      );
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
