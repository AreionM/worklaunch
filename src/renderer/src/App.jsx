import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import ItemRow from './components/ItemRow'
import ItemModal from './components/ItemModal'

const S = {
  app: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column' },
  header: {
    background: '#16213e',
    borderBottom: '1px solid #2962ff33',
    padding: '16px 24px',
    display: 'flex', alignItems: 'center', gap: 14
  },
  logo: { fontSize: 26 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#fff' },
  headerSub: { fontSize: 12, color: '#667799', marginTop: 2 },
  btnLaunch: {
    padding: '9px 20px', background: '#2962ff',
    border: 'none', borderRadius: 7,
    color: '#fff', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
  },
  main: { flex: 1, padding: '20px 24px', overflowY: 'auto' },
  section: { marginBottom: 28 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14
  },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: '0.08em' },
  btnAdd: {
    padding: '6px 16px', background: '#0f3460',
    border: '1px solid #2962ff66', borderRadius: 6,
    color: '#88aaff', fontSize: 13, cursor: 'pointer', fontWeight: 600
  },
  empty: {
    textAlign: 'center', padding: '40px 0',
    color: '#445577', fontSize: 14
  },
  footer: {
    background: '#16213e', borderTop: '1px solid #2962ff22',
    padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16
  },
  saveBtn: {
    padding: '9px 24px', background: '#2962ff',
    border: 'none', borderRadius: 7, color: '#fff',
    fontWeight: 700, fontSize: 14, cursor: 'pointer'
  },
  saveBtnDisabled: { opacity: 0.45, cursor: 'default' },
  savedBadge: { fontSize: 12, color: '#44cc88' },
  spacer: { flex: 1 },
  autoStartRow: { display: 'flex', alignItems: 'center', gap: 10 },
  autoStartLabel: { fontSize: 13, color: '#8899bb' },
  toggle: { position: 'relative', width: 38, height: 22 },
  toggleInput: { opacity: 0, width: 0, height: 0, position: 'absolute' },
  toggleSlider: (on) => ({
    position: 'absolute', inset: 0, borderRadius: 22,
    background: on ? '#2962ff' : '#33395a',
    transition: 'background 0.2s', cursor: 'pointer'
  }),
  toggleThumb: (on) => ({
    position: 'absolute', top: 3, left: on ? 19 : 3,
    width: 16, height: 16, borderRadius: '50%',
    background: '#fff', transition: 'left 0.2s'
  }),
  launchResults: {
    position: 'fixed', bottom: 70, right: 20,
    background: '#16213e', border: '1px solid #2962ff55',
    borderRadius: 10, padding: '14px 18px', minWidth: 240,
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 500
  },
  resultTitle: { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 },
  resultItem: (kind) => ({
    fontSize: 12, color: kind === 'launched' ? '#44cc88' : kind === 'skipped' ? '#ffaa44' : '#ff6666',
    marginBottom: 4
  }),
  version: { fontSize: 11, color: '#334466' }
}

export default function App() {
  const [config, setConfig] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const [modalItem, setModalItem] = useState(undefined) // undefined = closed, null = new, item = edit
  const [launchResult, setLaunchResult] = useState(null)
  const [launching, setLaunching] = useState(false)
  const [version, setVersion] = useState('')

  const api = window.electronAPI

  useEffect(() => {
    async function init() {
      const [cfg, as, ver] = await Promise.all([
        api.getConfig(),
        api.getAutoStart(),
        api.getVersion()
      ])
      setConfig(cfg)
      setAutoStart(as)
      setVersion(ver)
    }
    init()
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function updateItems(updater) {
    setConfig(c => ({ ...c, items: updater(c.items) }))
    setDirty(true)
    setSaved(false)
  }

  function handleToggle(id) {
    updateItems(items => items.map(it => it.id === id ? { ...it, enabled: !it.enabled } : it))
  }

  function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    updateItems(items => items.filter(it => it.id !== id))
  }

  function handleSaveItem(item) {
    updateItems(items => {
      const exists = items.find(it => it.id === item.id)
      if (exists) return items.map(it => it.id === item.id ? item : it)
      return [...items, item]
    })
    setModalItem(undefined)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    updateItems(items => {
      const from = items.findIndex(it => it.id === active.id)
      const to = items.findIndex(it => it.id === over.id)
      return arrayMove(items, from, to)
    })
  }

  async function handleSave() {
    if (!dirty) return
    await api.saveConfig(config)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleAutoStartToggle() {
    const next = !autoStart
    setAutoStart(next)
    await api.setAutoStart(next)
  }

  async function handleLaunchAll() {
    setLaunching(true)
    setLaunchResult(null)
    try {
      const result = await api.launchAll()
      setLaunchResult(result)
      setTimeout(() => setLaunchResult(null), 6000)
    } finally {
      setLaunching(false)
    }
  }

  if (!config) {
    return (
      <div style={{ ...S.app, alignItems: 'center', justifyContent: 'center', color: '#667799' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.logo}>🚀</span>
        <div style={S.headerText}>
          <div style={S.headerTitle}>WorkLaunch Settings</div>
          <div style={S.headerSub}>Configure your work apps and websites</div>
        </div>
        <button
          style={S.btnLaunch}
          onClick={handleLaunchAll}
          disabled={launching}
        >
          {launching ? '⏳ Launching...' : '⚡ Launch All'}
        </button>
      </div>

      {/* Item list */}
      <div style={S.main}>
        <div style={S.section}>
          <div style={S.sectionHeader}>
            <span style={S.sectionTitle}>Launch Items</span>
            <button style={S.btnAdd} onClick={() => setModalItem(null)}>+ Add Item</button>
          </div>

          {config.items.length === 0 ? (
            <div style={S.empty}>No items configured. Click "Add Item" to get started.</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={config.items.map(it => it.id)}
                strategy={verticalListSortingStrategy}
              >
                {config.items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onEdit={item => setModalItem(item)}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <div style={S.autoStartRow}>
          <span style={S.autoStartLabel}>Start with Windows</span>
          <label style={S.toggle}>
            <input
              type="checkbox"
              style={S.toggleInput}
              checked={autoStart}
              onChange={handleAutoStartToggle}
            />
            <div style={S.toggleSlider(autoStart)}>
              <div style={S.toggleThumb(autoStart)} />
            </div>
          </label>
        </div>
        <div style={S.spacer} />
        {saved && <span style={S.savedBadge}>✓ Saved</span>}
        <span style={S.version}>v{version}</span>
        <button
          style={{ ...S.saveBtn, ...(dirty ? {} : S.saveBtnDisabled) }}
          onClick={handleSave}
          disabled={!dirty}
        >
          Save Config
        </button>
      </div>

      {/* Launch result toast */}
      {launchResult && (
        <div style={S.launchResults}>
          <div style={S.resultTitle}>Launch Results</div>
          {launchResult.launched.map(n => (
            <div key={n} style={S.resultItem('launched')}>✓ {n}</div>
          ))}
          {launchResult.skipped.map(n => (
            <div key={n} style={S.resultItem('skipped')}>⊘ {n} (already running)</div>
          ))}
          {launchResult.failed.map(n => (
            <div key={n} style={S.resultItem('failed')}>✗ {n}</div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalItem !== undefined && (
        <ItemModal
          item={modalItem}
          onSave={handleSaveItem}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </div>
  )
}
