import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Save, User, Landmark, Plus, Trash2, GitBranch } from 'lucide-react'

const CATEGORY_LABELS = { notaris: 'Notaris', ppat: 'PPAT' }
const CATEGORY_STYLES = { notaris: 'badge-purple', ppat: 'badge-blue' }

function ActorEditor({ def, profileFields, documentCatalog, onChange, onRemove }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <User size={16} className="text-primary-700" />
        <span className="font-medium text-sm text-gray-900">{def.actor_type?.label}</span>
        <label className="ml-auto flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={!!def.is_required} onChange={(e) => onSave({ ...def, is_required: e.target.checked })} />
          Wajib
        </label>
        <button type="button" onClick={() => onRemove()} className="text-red-400 hover:text-red-600" title="Hapus"><Trash2 size={14} /></button>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Field Profil</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {profileFields.map((pf) => {
            const exists = (def.fields ?? []).find((f) => f.profile_field?.key === pf.key)
            return (
              <label key={pf.key} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={!!exists}
                  onChange={(e) => {
                    let next = def.fields ?? []
                    if (e.target.checked) next = [...next, { profile_field: pf, is_required: false }]
                    else next = next.filter((f) => f.profile_field?.key !== pf.key)
                    onSave({ ...def, fields: next })
                  }}
                />
                {pf.label}
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dokumen Diperlukan</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {documentCatalog.map((dc) => {
            const exists = (def.documents ?? []).find((d) => d.document_catalog?.key === dc.key)
            return (
              <label key={dc.key} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={!!exists}
                  onChange={(e) => {
                    let next = def.documents ?? []
                    if (e.target.checked) next = [...next, { document_catalog: dc, is_required: false }]
                    else next = next.filter((d) => d.document_catalog?.key !== dc.key)
                    onSave({ ...def, documents: next })
                  }}
                />
                {dc.label}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrderMapping() {
  const [types, setTypes] = useState([])
  const [pool, setPool] = useState({ actorTypes: [], profileFields: [], catalog: [], assetTypes: [] })
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    const res = await api.get('/admin/settings/order-mapping')
    setTypes(res.data.types ?? [])
    setPool({
      actor_types: res.data.actor_types ?? [],
      asset_types: res.data.asset_types ?? [],
      profileFields: res.data.profile_fields ?? [],
      catalog: res.data.document_catalog ?? [],
    })
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const draftOf = (tid) => {
    if (!drafts[tid]) {
      const t = types.find((x) => x.id === tid)
      setDrafts((d) => ({ ...d, [tid]: { actorDefinitions: (t?.actor_definitions ?? []).map((a) => structuredClone(a)), assetDefinitions: (t?.asset_definitions ?? []).map((a) => ({ ...a })), stages: (t?.stages ?? []).map((s) => s.stage_name) } }))
    }
    return drafts[tid] || { actorDefinitions: [], assetDefinitions: [], stages: [] }
  }

  const saveActor = (tid, idx, def) => {
    const d = draftOf(tid)
    setDrafts({ ...drafts, [tid]: { ...d, actorDefinitions: d.actorDefinitions.map((a, i) => (i === idx ? { ...a, ...def } : a)) } })
  }
  const removeActor = (tid, idx) => {
    const d = draftOf(tid)
    setDrafts({ ...drafts, [tid]: { ...d, actorDefinitions: d.actorDefinitions.filter((_, i) => i !== idx) } })
  }
  const addActor = (tid, actorTypeKey) => {
    if (!actorTypeKey) return
    const d = draftOf(tid)
    const at = pool.actor_types.find((a) => a.key === actorTypeKey)
    if (d.actorDefinitions.some((a) => a.actor_type?.key === actorTypeKey)) { toast.error('Aktor sudah ada'); return }
    setDrafts({ ...drafts, [tid]: { ...d, actorDefinitions: [...d.actorDefinitions, { actor_type: at, is_required: true, fields: [], documents: [] }] } })
  }

  const setStage = (tid, idx, val) => {
    const d = draftOf(tid)
    setDrafts({ ...drafts, [tid]: { ...d, stages: d.stages.map((s, i) => (i === idx ? val : s)) } })
  }
  const removeStage = (tid, idx) => {
    const d = draftOf(tid)
    setDrafts({ ...drafts, [tid]: { ...d, stages: d.stages.filter((_, i) => i !== idx) } })
  }
  const addStage = (tid) => {
    const d = draftOf(tid)
    setDrafts({ ...drafts, [tid]: { ...d, stages: [...d.stages, 'Tahapan baru'] } })
  }

  const handleSave = async (tid) => {
    setSavingId(tid)
    const d = draftOf(tid)
    const payload = {
      type_id: tid,
      actors: d.actorDefinitions.map((a) => ({
        actor_type_key: a.actor_type?.key,
        is_required: !!a.is_required,
        label_override: a.label_override,
        fields: (a.fields ?? []).map((f) => ({ profile_field_key: f.profile_field?.key, is_required: !!f.is_required })),
        documents: (a.documents ?? []).map((dc) => ({ document_catalog_key: dc.document_catalog?.key, is_required: !!dc.is_required })),
      })),
      assets: d.assetDefinitions.map((a) => ({ asset_type_key: a.asset_type?.key, is_required: !!a.is_required })),
      stages: d.stages.map((n) => ({ stage_name: n })),
    }
    try {
      await api.post('/admin/settings/order-mapping', payload)
      toast.success('Mapping berhasil disimpan')
      await load()
      setDrafts((df) => { const n = { ...df }; delete n[tid]; return n })
    } catch {
      toast.error('Gagal menyimpan mapping')
    }
    setSavingId(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mapping Order</h1>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi pihak (aktor), field, dokumen, dan aset untuk tiap jenis order</p>
      </div>

      {types.map((t) => {
        const d = draftOf(t.id)
        const addedKeys = d.actorDefinitions.map((a) => a.actor_type?.key)
        const options = pool.actor_types.filter((a) => !addedKeys.includes(a.key))
        return (
          <div key={t.id} className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">{t.name}</h2>
              <span className="text-xs text-gray-400">/{t.slug}</span>
              {t.category && (
                <span className={CATEGORY_STYLES[t.category] ?? 'badge-gray'}>
                  {CATEGORY_LABELS[t.category] ?? t.category}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pihak (Aktor)</p>
                <div className="flex items-center gap-2">
                  <select className="input text-xs py-1 w-auto addactor-{t.id}">
                    <option value="">+ Tambah pihak...</option>
                    {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                  <button type="button" className="btn-secondary text-xs py-1" onClick={() => addActor(t.id, document.querySelector(`.addactor-${t.id}`).value)}>
                    <Plus size={13} /> Tambah
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {d.actorDefinitions.length === 0 && <p className="text-xs text-gray-400">Belum ada pihak</p>}
                {d.actorDefinitions.map((a, i) => (
                  <ActorEditor
                    key={`${a.actor_type?.key}-${i}`}
                    type={t}
                    def={a}
                    profileFields={pool.profileFields}
                    documentCatalog={pool.catalog}
                    onSave={(next) => saveActor(t.id, i, next)}
                    onRemove={() => removeActor(t.id, i)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Aset</p>
              {d.assetDefinitions.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada aset</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {d.assetDefinitions.map((a) => (
                    <span key={a.asset_type?.key} className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg py-1 px-2">
                      <Landmark size={13} className="text-primary-700" />
                      {a.asset_type?.label}
                      <input type="checkbox" checked={!!a.is_required} onChange={(e) => {
                        const nd = draftOf(t.id)
                        setDrafts({ ...drafts, [t.id]: { ...nd, assetDefinitions: nd.assetDefinitions.map((x) => (x.asset_type?.key === a.asset_type?.key ? { ...x, is_required: e.target.checked } : x)) } })
                      }} title="Wajib" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tahapan Proses</p>
                <button type="button" onClick={() => addStage(t.id)} className="btn-secondary text-xs py-1">
                  <Plus size={13} /> Tambah Tahapan
                </button>
              </div>
              <div className="space-y-2">
                {d.stages.length === 0 && <p className="text-xs text-gray-400">Belum ada tahapan</p>}
                {d.stages.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GitBranch size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                    <input
                      className="input text-sm"
                      value={name}
                      onChange={(e) => setStage(t.id, i, e.target.value)}
                    />
                    <button type="button" onClick={() => removeStage(t.id, i)} className="text-red-400 hover:text-red-600" title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => handleSave(t.id)} disabled={savingId === t.id} className="btn-primary">
                <Save size={15} /> {savingId === t.id ? 'Menyimpan...' : 'Simpan Mapping'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}