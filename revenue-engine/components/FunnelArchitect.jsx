import React, { useState, useRef } from 'react';

// --- SUB-COMPONENT: CONNECTION LINE ---
const SvgEdge = ({ sourcePos, targetPos, isActive }) => {
  const deltaX = targetPos.x - sourcePos.x;
  // Calculate perfect cubic bezier curve control handles
  const controlX1 = sourcePos.x + deltaX / 2;
  const controlX2 = targetPos.x - deltaX / 2;

  const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${controlX1} ${sourcePos.y}, ${controlX2} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;

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
};

// --- SUB-COMPONENT: ARCHITECT NODE ---
const ArchitectNode = ({ id, type, label, position, metrics, onDrag }) => {
  const isConversionNode = type === 'checkout' || type === 'upsell';

  return (
    <div
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0px)` }}
      className="absolute w-64 bg-[#121317] border border-white/[0.06] rounded-lg shadow-2xl backdrop-blur-md select-none transition-shadow duration-200 hover:border-white/[0.12]"
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
};

// --- CORE FRAMEWORK COMPONENT ---
export default function FunnelArchitect() {
  // Demo functional snapshot matching state system specs
  const [nodes, setNodes] = useState([
    { id: '1', type: 'traffic', label: 'Paid Meta Framework', position: { x: 100, y: 150 }, metrics: { volume: '24k', cpc: '$0.38' } },
    { id: '2', type: 'landing_page', label: 'V1 Main Sales Flow', position: { x: 450, y: 150 }, metrics: { views: '18k', cr: '4.2%' } },
    { id: '3', type: 'checkout', label: 'Premium Suite Core', position: { x: 800, y: 150 }, metrics: { sales: '756', conversion: '12%' } },
  ]);

  return (
    <div className="relative w-full h-[600px] bg-[#000000] overflow-hidden rounded-xl border border-white/[0.04]">
      {/* High-Contrast Financial Grid Background Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px]"
        style={{ backgroundPosition: 'center center' }}
      />

      {/* SVG Canvas Overlay for Flow Connections */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
        <SvgEdge sourcePos={{ x: 356, y: 220 }} targetPos={{ x: 450, y: 220 }} isActive={true} />
        <SvgEdge sourcePos={{ x: 706, y: 220 }} targetPos={{ x: 800, y: 220 }} isActive={false} />
      </svg>

      {/* Foreground Interactive Node System Layer */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {nodes.map((node) => (
          <ArchitectNode
            key={node.id}
            {...node}
            onDrag={() => { /* State coordinate patch hooks trigger here */ }}
          />
        ))}
      </div>
    </div>
  );
}
