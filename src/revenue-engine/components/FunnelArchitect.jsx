import React, { useRef, useMemo, useCallback, memo } from 'react';
import { useFunnel } from '../context/FunnelProvider';

const NODE_WIDTH = 256;
const NODE_HEIGHT = 114;

// --- SUB-COMPONENT: CONNECTION LINE (SVG EDGE) ---
/**
 * ⚡ OPTIMIZATION: Memoized SvgEdge with flattened primitive props.
 * Prevents re-renders of all edges when a single node moves.
 * Using primitive X/Y coords instead of objects ensures shallow comparison works correctly.
 */
const SvgEdge = memo(({ sourceX, sourceY, targetX, targetY, isActive }) => {
  const deltaX = targetX - sourceX;
  const controlX1 = sourceX + deltaX / 2;
  const controlX2 = targetX - deltaX / 2;
  
  const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;

  return (
    <g>
      {/* Glow path layer for active traffic streams */}
      {isActive && (
        <path
          d={pathData}
          fill="none"
          stroke="#50C878"
          strokeWidth="3"
          className="opacity-20 blur-[2px]"
        />
      )}
      <path
        d={pathData}
        fill="none"
        stroke={isActive ? '#50C878' : '#27272a'}
        strokeWidth="1.5"
        strokeDasharray={isActive ? '6, 4' : 'none'}
        className={isActive ? 'animate-[dash_20s_linear_infinite]' : ''}
      />
    </g>
  );
});

// --- SUB-COMPONENT: INTERACTIVE ARCHITECT NODE ---
/**
 * ⚡ OPTIMIZATION: Memoized ArchitectNode.
 * Prevents re-renders of other nodes when one node is being dragged.
 */
const ArchitectNode = memo(({ id, type, label, position, metrics, onNodeDrag }) => {
  const isConversionNode = type === 'checkout' || type === 'upsell';
  const nodeRef = useRef(null);
  const dragStateRef = useRef({ startX: 0, startY: 0 });

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    const el = nodeRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };

    const handlePointerMove = (moveEvent) => {
      const nextX = moveEvent.clientX - dragStateRef.current.startX;
      const nextY = moveEvent.clientY - dragStateRef.current.startY;
      onNodeDrag(id, nextX, nextY);
    };

    const handlePointerUp = (upEvent) => {
      el.releasePointerCapture(upEvent.pointerId);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
  }, [id, position.x, position.y, onNodeDrag]);

  return (
    <div
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      style={{ 
        transform: `translate3d(${position.x}px, ${position.y}px, 0px)`,
        touchAction: 'none',
        willChange: 'transform',
      }}
      className="absolute w-64 bg-[#121317] border border-white/[0.06] rounded-lg shadow-2xl backdrop-blur-md select-none hover:border-white/[0.12] cursor-grab active:cursor-grabbing z-20 pointer-events-auto transition-shadow duration-200"
    >
      {/* Node Header Accent Line */}
      <div className={`h-[2px] w-full rounded-t-lg ${isConversionNode ? 'bg-[#D4AF37]' : 'bg-[#50C878]'}`} />

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium font-['Inter']">
            {type}
          </span>
          <span className={`h-1.5 w-1.5 rounded-full ${isConversionNode ? 'bg-[#D4AF37]' : 'bg-[#50C878]'}`} />
        </div>

        <h4 className="text-zinc-200 text-sm font-semibold mb-3 font-['Inter'] tracking-tight truncate">
          {label}
        </h4>

        {/* Node Live Technical Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04] font-['JetBrains_Mono'] text-xs">
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase">{key}</span>
              <span className="text-zinc-300 font-medium mt-0.5">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Input / Output Visual Connection Ports */}
      <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-3 h-3 bg-[#000000] border border-zinc-700 rounded-full hover:border-[#50C878] cursor-crosshair" />
      <div className="absolute right-0 top-1/2 translate-x-1.5 -translate-y-1/2 w-3 h-3 bg-[#000000] border border-zinc-700 rounded-full hover:border-[#50C878] cursor-crosshair" />
    </div>
  );
});

// --- CORE MASTER COMPONENT ---
export default function FunnelArchitect() {
  const { nodes, edges, updateNodePosition } = useFunnel();

  /**
   * ⚡ OPTIMIZATION: O(N) Node indexing.
   * Creates a map of nodes by ID to allow O(1) lookups during edge coordinate calculation.
   * This reduces overall complexity from O(N*E) to O(N+E).
   */
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Memoize edge calculations to prevent unnecessary re-renders
  const renderedEdges = useMemo(
    () => edges
      .map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        if (!sourceNode || !targetNode) return null;

        return {
          id: edge.id,
          isActive: edge.isActive,
          sourceX: sourceNode.position.x + NODE_WIDTH,
          sourceY: sourceNode.position.y + NODE_HEIGHT / 2,
          targetX: targetNode.position.x,
          targetY: targetNode.position.y + NODE_HEIGHT / 2,
        };
      })
      .filter(edge => edge !== null),
    [edges, nodeMap]
  );

  return (
    <div className="relative w-full h-[600px] bg-[#000000] overflow-hidden rounded-xl border border-white/[0.04]">
      {/* High-Contrast Financial Grid Background Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px]"
        style={{ backgroundPosition: 'center center' }}
      />

      {/* SVG Canvas Overlay for Flow Connections */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
        {renderedEdges.map((edge) => (
          <SvgEdge
            key={edge.id}
            sourceX={edge.sourceX}
            sourceY={edge.sourceY}
            targetX={edge.targetX}
            targetY={edge.targetY}
            isActive={edge.isActive}
          />
        ))}
      </svg>

      {/* Foreground Interactive Node System Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {nodes.map((node) => (
          <ArchitectNode
            key={node.id}
            {...node}
            onNodeDrag={updateNodePosition}
          />
        ))}
      </div>
    </div>
  );
}
