import React, { useState, useRef, useEffect } from 'react';

/**
 * NodeContextMenu
 * 
 * Context menu for node CRUD operations:
 * - Edit node label and type
 * - Delete node and connected edges
 * - View/manage metrics
 * - Inspect node state
 */
export const NodeContextMenu = ({
  nodeId,
  nodeType,
  nodeLabel,
  position,
  onClose,
  onEdit,
  onDelete,
  onClone,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(nodeLabel);
  const [editType, setEditType] = useState(nodeType);
  const menuRef = useRef(null);

  const nodeTypes = [
    { value: 'traffic', label: 'Traffic Source' },
    { value: 'landing_page', label: 'Landing Page' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'upsell', label: 'Upsell' },
    { value: 'custom', label: 'Custom' },
  ];

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSaveEdit = () => {
    onEdit(nodeId, {
      label: editLabel,
      type: editType,
    });
    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete node "${nodeLabel}"?`)) {
      onDelete(nodeId);
      onClose();
    }
  };

  if (isEditing) {
    return (
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
        }}
        className="bg-[#121317] border border-white/[0.1] rounded-lg shadow-2xl p-4 w-64 backdrop-blur-md"
      >
        <h3 className="text-zinc-200 font-semibold mb-4 text-sm">Edit Node</h3>

        <div className="mb-4">
          <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">Label</label>
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="w-full mt-2 bg-[#1a1d22] border border-white/[0.08] rounded px-3 py-2 text-zinc-200 text-sm focus:border-[#50C878] outline-none"
            placeholder="Node label"
          />
        </div>

        <div className="mb-4">
          <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">Type</label>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full mt-2 bg-[#1a1d22] border border-white/[0.08] rounded px-3 py-2 text-zinc-200 text-sm focus:border-[#50C878] outline-none"
          >
            {nodeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
          <button
            onClick={handleSaveEdit}
            className="flex-1 bg-[#50C878] text-black text-xs font-semibold py-2 rounded hover:bg-[#45b86f] transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-white/[0.08] text-zinc-300 text-xs font-semibold py-2 rounded hover:bg-white/[0.12] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
      className="bg-[#121317] border border-white/[0.1] rounded-lg shadow-2xl overflow-hidden backdrop-blur-md"
    >
      <button
        onClick={() => setIsEditing(true)}
        className="w-full px-4 py-2.5 text-left text-zinc-200 text-sm hover:bg-white/[0.08] transition-colors border-b border-white/[0.05] font-medium"
      >
        ✏️ Edit
      </button>
      <button
        onClick={() => onClone(nodeId)}
        className="w-full px-4 py-2.5 text-left text-zinc-200 text-sm hover:bg-white/[0.08] transition-colors border-b border-white/[0.05] font-medium"
      >
        📋 Duplicate
      </button>
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2.5 text-left text-red-400 text-sm hover:bg-red-400/[0.1] transition-colors font-medium"
      >
        🗑️ Delete
      </button>
    </div>
  );
};
