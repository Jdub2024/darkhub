import React, { useState, useRef, useCallback } from 'react';

/**
 * EdgeBuilder
 * 
 * Creates and manages connections between nodes.
 * Drag from a source port to target port to create edges.
 * Click on edges to delete them.
 */
export const EdgeBuilder = ({
  nodes,
  edges,
  onAddEdge,
  onDeleteEdge,
  onCancel,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [sourcePos, setSourcePos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const NODE_WIDTH = 256;
  const NODE_HEIGHT = 114;

  const handlePortMouseDown = useCallback((nodeId, isOutput) => {
    if (isOutput) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setIsConnecting(true);
        setSourceNodeId(nodeId);
        setSourcePos({
          x: node.position.x + NODE_WIDTH,
          y: node.position.y + NODE_HEIGHT / 2,
        });
      }
    }
  }, [nodes]);

  const handlePortMouseUp = useCallback(
    (targetNodeId, isInput) => {
      if (isConnecting && isInput && sourceNodeId && sourceNodeId !== targetNodeId) {
        // Check if edge already exists
        const edgeExists = edges.some(
          (e) => e.source === sourceNodeId && e.target === targetNodeId
        );

        if (!edgeExists) {
          onAddEdge({
            id: `edge_${sourceNodeId}_${targetNodeId}_${Date.now()}`,
            source: sourceNodeId,
            target: targetNodeId,
            isActive: false,
          });
        }
      }

      setIsConnecting(false);
      setSourceNodeId(null);
      setSourcePos({ x: 0, y: 0 });
      setCurrentPos({ x: 0, y: 0 });
    },
    [isConnecting, sourceNodeId, edges, onAddEdge]
  );

  const handleMouseMove = useCallback((e) => {
    if (isConnecting && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      setCurrentPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [isConnecting]);

  const handleMouseUp = useCallback(() => {
    if (isConnecting) {
      setIsConnecting(false);
      setSourceNodeId(null);
      setSourcePos({ x: 0, y: 0 });
      setCurrentPos({ x: 0, y: 0 });
    }
  }, [isConnecting]);

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    handlePortMouseDown,
    handlePortMouseUp,
    isConnecting,
    sourcePos,
    currentPos,
  };
};

/**
 * Port component for nodes
 */
export const Port = ({ nodeId, type, onMouseDown, onMouseUp, isConnecting, isSource }) => {
  return (
    <div
      onMouseDown={() => isSource && onMouseDown(nodeId, true)}
      onMouseUp={() => !isSource && onMouseUp(nodeId, true)}
      className={`absolute ${isSource ? 'right-0 translate-x-1.5' : 'left-0 -translate-x-1.5'} top-1/2 -translate-y-1/2 w-3 h-3 bg-[#000000] border border-zinc-700 rounded-full cursor-crosshair hover:border-[#50C878] transition-colors ${
        isConnecting && isSource ? 'border-[#50C878] scale-110' : ''
      }`}
      style={{ pointerEvents: 'auto' }}
    />
  );
};
