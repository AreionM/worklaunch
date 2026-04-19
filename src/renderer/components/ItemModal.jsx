import React, { useState, useEffect } from 'react'

const STYLES = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#16213e',
    border: '1px solid #2962ff',
    borderRadius: 10,
    padding: 28,
    width: 500,
    maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  title: { fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 },
  fieldGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, color: '#8899bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    width: '100%', padding: '9px 12px',
    background: '#0f3460', border: '1px solid #2962ff44',
    borderRadius: 6, color: '#e0e0e0', fontSize: 14, outline: 'none'
  },
  row: { display: 'flex', gap: 10 },
  select: {
    flex: '0 0 120px', padding: '9px 12px',
    background: '#0f3460', border: '1px solid #2962ff44',
    borderRadius: 6, color: '#e0e0e0', fontSize: 14, outline: 'none'
  },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 },
  btnPrimary: {
    padding: '9px 22px', background: '#2962ff', border: 'none',
    borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '9px 22px', background: '#2a2a4a', border: '1px solid #444',
    borderRadius: 6, color: '#bbb', fontSize: 14, cursor: 'pointer'
  },
  hint: { fontSize: 11, color: '#667799', marginTop: 5 }
}

const EMPTY = { name: '', type: 'app', path: '', args: '', processName: '', enabled: true }

export default function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (item) {
      setForm({ ...item, args: Array.isArray(item.args) ? item.args.join(' ') : (item.args || '') })
    } else {
      setForm(EMPTY)
    }
  }, [item])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSave() {
    if (!form.name.trim() || !form.path.trim()) return
    const parsed = {
      ...form,
      name: form.name.trim(),
      path: form.path.trim(),
      processName: form.processName.trim(),
      args: form.args.trim() ? form.args.trim().split(/\s+/) : [],
      id: form.id || `item-${Date.now()}`
    }
    onSave(parsed)
  }

  return (
    <div style={STYLES.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={STYLES.modal}>
        <div style={STYLES.title}>{item ? 'Edit Item' : 'Add New Item'}</div>

        <div style={STYLES.fieldGroup}>
          <label style={STYLES.label}>Name</label>
          <input style={STYLES.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Slack" />
        </div>

        <div style={STYLES.fieldGroup}>
          <div style={STYLES.row}>
            <div style={{ flex: 1 }}>
              <label style={STYLES.label}>Type</label>
              <select style={STYLES.select} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="app">App</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>
        </div>

        <div style={STYLES.fieldGroup}>
          <label style={STYLES.label}>{form.type === 'website' ? 'URL' : 'Executable Path'}</label>
          <input
            style={STYLES.input}
            value={form.path}
            onChange={e => set('path', e.target.value)}
            placeholder={form.type === 'website' ? 'https://example.com' : 'C:\\Program Files\\App\\app.exe'}
          />
          {form.type === 'app' && (
            <div style={STYLES.hint}>Full path to the .exe file</div>
          )}
        </div>

        {form.type === 'app' && (
          <>
            <div style={STYLES.fieldGroup}>
              <label style={STYLES.label}>Process Name (for duplicate check)</label>
              <input
                style={STYLES.input}
                value={form.processName}
                onChange={e => set('processName', e.target.value)}
                placeholder="app.exe"
              />
              <div style={STYLES.hint}>The .exe name shown in Task Manager</div>
            </div>

            <div style={STYLES.fieldGroup}>
              <label style={STYLES.label}>Launch Arguments (optional, space-separated)</label>
              <input
                style={STYLES.input}
                value={form.args}
                onChange={e => set('args', e.target.value)}
                placeholder="--flag value"
              />
            </div>
          </>
        )}

        <div style={STYLES.btnRow}>
          <button style={STYLES.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={STYLES.btnPrimary} onClick={handleSave}>
            {item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
