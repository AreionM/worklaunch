import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const S = {
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px',
    background: '#0f3460',
    border: '1px solid #1e3a6e',
    borderRadius: 8,
    marginBottom: 8,
    transition: 'border-color 0.15s, background 0.15s',
    userSelect: 'none'
  },
  rowDisabled: { opacity: 0.5 },
  drag: {
    fontSize: 18, color: '#445577', cursor: 'grab',
    flexShrink: 0, lineHeight: 1, padding: '0 2px'
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta: { fontSize: 11, color: '#667799', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  typeBadge: {
    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
    flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em'
  },
  toggle: { position: 'relative', width: 38, height: 22, flexShrink: 0 },
  toggleInput: { opacity: 0, width: 0, height: 0, position: 'absolute' },
  toggleSlider: (enabled) => ({
    position: 'absolute', inset: 0, borderRadius: 22,
    background: enabled ? '#2962ff' : '#33395a',
    transition: 'background 0.2s', cursor: 'pointer'
  }),
  toggleThumb: (enabled) => ({
    position: 'absolute', top: 3, left: enabled ? 19 : 3,
    width: 16, height: 16, borderRadius: '50%',
    background: '#fff', transition: 'left 0.2s'
  }),
  btnEdit: {
    padding: '5px 12px', background: '#1e3a6e',
    border: '1px solid #2962ff55', borderRadius: 5,
    color: '#88aaff', fontSize: 12, cursor: 'pointer', flexShrink: 0
  },
  btnDelete: {
    padding: '5px 12px', background: '#3a1e1e',
    border: '1px solid #ff444455', borderRadius: 5,
    color: '#ff8888', fontSize: 12, cursor: 'pointer', flexShrink: 0
  }
}

export default function ItemRow({ item, onToggle, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined
  }

  const typeBadge = item.type === 'website'
    ? { background: '#1a3a2a', color: '#44cc88' }
    : { background: '#1a2540', color: '#6699ff' }

  return (
    <div ref={setNodeRef} style={{ ...style }}>
      <div style={{ ...S.row, ...(item.enabled ? {} : S.rowDisabled) }}>
        <span style={S.drag} {...attributes} {...listeners} title="Drag to reorder">⠿</span>

        <div style={S.info}>
          <div style={S.name}>{item.name}</div>
          <div style={S.meta}>
            {item.type === 'website' ? item.path : (item.processName || item.path)}
          </div>
        </div>

        <span style={{ ...S.typeBadge, ...typeBadge }}>{item.type}</span>

        <label style={S.toggle} title={item.enabled ? 'Disable' : 'Enable'}>
          <input
            type="checkbox"
            style={S.toggleInput}
            checked={item.enabled}
            onChange={() => onToggle(item.id)}
          />
          <div style={S.toggleSlider(item.enabled)}>
            <div style={S.toggleThumb(item.enabled)} />
          </div>
        </label>

        <button style={S.btnEdit} onClick={() => onEdit(item)}>Edit</button>
        <button style={S.btnDelete} onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  )
}
