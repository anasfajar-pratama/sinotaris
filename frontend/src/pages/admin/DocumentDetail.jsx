import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { storageUrl } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Clock, Circle, Upload, Trash2, User, Landmark, Eye, RefreshCw, Calendar, Image, Plus, Save, UserPlus, History, Pencil, X, Activity, ChevronDown } from 'lucide-react'

const STAGE_STATUS_ICON = {
  completed:   <CheckCircle size={20} className="text-green-500" />,
  in_progress: <Clock size={20} className="text-blue-500 animate-pulse" />,
  pending:     <Circle size={20} className="text-gray-300" />,
}

const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }
const STATUS_STYLES = { draft: 'badge-gray', in_progress: 'badge-blue', review: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }

// Kategori tugas Notaris / PPAT
const CATEGORY_STYLES = { notaris: 'badge-purple', ppat: 'badge-blue' }
const CATEGORY_LABELS = { notaris: 'Notaris', ppat: 'PPAT' }

const MARITAL_LABELS = { single: 'Lajang', married: 'Menikah', widowed: 'Cerai' }
const isImageUrl = (url) => /\.(webp|jpg|jpeg|png)$/i.test(url || '')

// Field aset tidak disimpan sebagai template field, dipakai untuk modal edit aset.
const ASSET_FIELDS = [
  { key: 'sertifikat_no', label: 'Nomor Sertifikat', data_type: 'text' },
  { key: 'luas', label: 'Luas Tanah (m²)', data_type: 'text' },
  { key: 'lokasi', label: 'Alamat & Lokasi Tanah', data_type: 'textarea' },
]

function FieldInput({ field, value, onChange }) {
  const opts = field.options ?? []
  if (field.data_type === 'textarea') {
    return <textarea className="input h-20 resize-none" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />
  }
  if (field.data_type === 'select') {
    return (
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pilih...</option>
        {opts.map((o, i) => {
          const val = typeof o === 'object' ? o.value : o
          const label = typeof o === 'object' ? o.label : o
          return <option key={i} value={val}>{label}</option>
        })}
      </select>
    )
  }
  const type = { text: 'text', number: 'number', email: 'email', date: 'date' }[field.data_type] ?? 'text'
  return <input type={type} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />
}

// Modal kecil untuk edit data (Order/Pihak/Aset).
function EditModal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Tutup"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  )
}

// Card yang isinya bisa dilipat/dibuka lewat header.
function CollapsibleCard({ id, title, right, collapsed, onToggle, children, defaultOpen = true, alwaysOpen = false }) {
  const isOpen = alwaysOpen || !collapsed
  return (
    <div className="card">
      <button
        type="button"
        onClick={() => !alwaysOpen && onToggle(id)}
        disabled={alwaysOpen}
        className={`w-full flex items-center gap-2 px-5 py-4 text-left ${alwaysOpen ? 'cursor-default' : 'hover:bg-gray-50 transition-colors cursor-pointer'}`}
      >
        <h2 className="text-base font-semibold text-gray-900 flex-1">{title}</h2>
        {right}
        {!alwaysOpen && (
          <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
        )}
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function DocFileItem({ doc, onReplace, onDelete }) {
  const url = storageUrl(doc.url)
  return (
    <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg p-2">
      <span className="text-gray-500 flex-shrink-0">{doc.document_catalog?.label ?? 'Dokumen'}</span>
      <span className="text-gray-700 truncate flex-1">{doc.original_name}</span>
      {isImageUrl(url) ? (
        <a href={url} target="_blank" rel="noreferrer" className="flex-shrink-0" title="Preview">
          <img src={url} alt={doc.original_name} className="h-10 w-10 object-cover rounded-lg border border-gray-200" />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline flex-shrink-0">Buka</a>
      )}
      {onReplace && (
        <label className="flex items-center gap-1 text-primary-600 hover:underline cursor-pointer flex-shrink-0" title="Ubah">
          <RefreshCw size={13} /> Ubah
          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f) }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      )}
      {onDelete && (
        <button onClick={() => onDelete(doc.id)} className="text-red-400 hover:text-red-600 flex-shrink-0" title="Hapus">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

export default function AdminDocumentDetail() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStage, setUpdatingStage] = useState(null)
  const [stageNotes, setStageNotes] = useState({})
  const [actorUploading, setActorUploading] = useState(null)
  const [assetUploading, setAssetUploading] = useState(null)
  const [, setOrderDocUploading] = useState(null)
  const [completeness, setCompleteness] = useState(null)
  const [employees, setEmployees] = useState([])
  const [stagePic, setStagePic] = useState({})
  const [stageDocUploading, setStageDocUploading] = useState(null)
  const [transferOpen, setTransferOpen] = useState({})

  // Modal edit data (order/pihak/aset) + log aktivitas
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [editOrderForm, setEditOrderForm] = useState({ title: '', description: '', priority: 'normal', deadline: '', notes: '' })
  const [savingEditOrder, setSavingEditOrder] = useState(false)
  const [editEntity, setEditEntity] = useState(null) // {kind:'actor'|'asset', id, label}
  const [entityTemplate, setEntityTemplate] = useState(null)
  const [entityData, setEntityData] = useState({})
  const [entityFiles, setEntityFiles] = useState({})
  const [savingEditEntity, setSavingEditEntity] = useState(false)
  const [activities, setActivities] = useState([])
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  // Semua section default terlipat saat masuk; Timeline Proses selalu terbuka (alwaysOpen).
  const [collapsedSections, setCollapsedSections] = useState({
    'info-order': true,
    kelengkapan: true,
    pihak: true,
    aset: true,
    klien: true,
    log: true,
  })

  const toggleSection = (key) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/documents/${id}`)
      setDoc(res.data.document)
      setCompleteness(res.data.completeness)
    } catch {}
    setLoading(false)
    loadActivity()
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    api.get('/admin/employees').then((res) => {
      const all = res.data.data ?? []
      setEmployees(all.filter((u) => u.role !== 'klien' && u.is_active).map((u) => ({ id: u.id, name: u.name, role: u.role })))
    }).catch(() => {})
  }, [])

  const uploadDoc = async (path, file, setUploading, docKey) => {
    const fd = new FormData()
    fd.append('file', file)
    if (docKey) fd.append('doc_key', docKey)
    setUploading(true)
    try {
      await api.post(path, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Dokumen berhasil diupload')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload')
    }
    setUploading(false)
  }

  const uploadActorDoc = (actorId, docKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadDoc(`/admin/orders/${id}/actors/${actorId}/documents`, file, setActorUploading, docKey)
  }
  const uploadAssetDoc = (assetId, docKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadDoc(`/admin/orders/${id}/assets/${assetId}/documents`, file, setAssetUploading, docKey)
  }
  const uploadOrderDoc = (docKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadDoc(`/admin/orders/${id}/documents`, file, setOrderDocUploading, docKey)
  }

  const deleteActorDoc = async (actorId, fileId) => {
    if (!window.confirm('Hapus dokumen ini?')) return
    try {
      await api.delete(`/admin/orders/${id}/actors/${actorId}/documents/${fileId}`)
      toast.success('Dokumen dihapus')
      load()
    } catch {}
  }
  const deleteAssetDoc = async (assetId, fileId) => {
    if (!window.confirm('Hapus dokumen ini?')) return
    try {
      await api.delete(`/admin/orders/${id}/assets/${assetId}/documents/${fileId}`)
      toast.success('Dokumen dihapus')
      load()
    } catch {}
  }

  const replaceOrderDoc = async (itemKey, file, currentFileId = null) => {
    if (currentFileId) {
      await api.delete(`/admin/orders/${id}/documents/${currentFileId}`).catch(() => {})
    } else {
      const existing = (doc.order_documents || []).filter((d) => d.document_catalog?.key === itemKey)
      for (const e of existing) await api.delete(`/admin/orders/${id}/documents/${e.id}`).catch(() => {})
    }
    uploadDoc(`/admin/orders/${id}/documents`, file, setOrderDocUploading, itemKey)
  }
  const replaceActorDoc = async (actorId, itemKey, file, currentFileId = null) => {
    if (currentFileId) {
      await api.delete(`/admin/orders/${id}/actors/${actorId}/documents/${currentFileId}`).catch(() => {})
    } else {
      const actor = (doc.actors || []).find((a) => a.id === actorId)
      const existing = (actor?.documents || []).filter((d) => d.document_catalog?.key === itemKey)
      for (const e of existing) await api.delete(`/admin/orders/${id}/actors/${actorId}/documents/${e.id}`).catch(() => {})
    }
    uploadDoc(`/admin/orders/${id}/actors/${actorId}/documents`, file, setActorUploading, itemKey)
  }
  const replaceAssetDoc = async (assetId, itemKey, file, currentFileId = null) => {
    if (currentFileId) {
      await api.delete(`/admin/orders/${id}/assets/${assetId}/documents/${currentFileId}`).catch(() => {})
    } else {
      const asset = (doc.assets || []).find((a) => a.id === assetId)
      const existing = (asset?.documents || []).filter((d) => d.document_catalog?.key === itemKey)
      for (const e of existing) await api.delete(`/admin/orders/${id}/assets/${assetId}/documents/${e.id}`).catch(() => {})
    }
    uploadDoc(`/admin/orders/${id}/assets/${assetId}/documents`, file, setAssetUploading, itemKey)
  }

  const resolveDoc = (item, group) => {
    if (group === 'Order') {
      // Prioritas: file di order_documents; fallback ke dokumen yang sama di aset
      // (IMB/SLF/SPPT yang diunggah lewat card Aset tetap dianggap melengkapi order).
      const dOrder = (doc.order_documents || []).find((x) => x.document_catalog?.key === item.key)
      if (dOrder) return { url: dOrder.url, kind: 'order' }
      const assetWithDoc = (doc.assets || []).find(
        (a) => (a.documents || []).some((x) => x.document_catalog?.key === item.key)
      )
      if (!assetWithDoc) return null
      const dAsset = assetWithDoc.documents.find((x) => x.document_catalog?.key === item.key)
      return dAsset ? { url: dAsset.url, kind: 'asset', assetId: assetWithDoc.id } : null
    }
    const actor = (doc.actors || []).find(
      (a) => (a.actor_type?.label ?? 'Pihak') === group && (a.documents || []).some((x) => x.document_catalog?.key === item.key)
    )
    if (!actor) return null
    const d = actor.documents.find((x) => x.document_catalog?.key === item.key)
    return d ? { url: d.url, kind: 'actor', actorId: actor.id } : null
  }

  const handleUpdateStage = async (stageNumber, status) => {
    setUpdatingStage(stageNumber)
    try {
      await api.put(`/admin/documents/${id}/stage`, {
        stage_number: stageNumber,
        status,
        notes: stageNotes[stageNumber] || '',
        pic_id: stagePic[stageNumber] || null,
      })
      toast.success('Status tahapan berhasil diperbarui')
      setStagePic((p) => ({ ...p, [stageNumber]: undefined }))
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui')
    }
    setUpdatingStage(null)
  }

  const handleSaveStage = async (stageNumber) => {
    const stage = (doc.stages || []).find((s) => s.stage_number === stageNumber)
    if (!stage) return
    setUpdatingStage(stageNumber)
    try {
      await api.put(`/admin/documents/${id}/stage`, {
        stage_number: stageNumber,
        status: stage.status,
        notes: stageNotes[stageNumber] || '',
        pic_id: stagePic[stageNumber] || null,
      })
      toast.success('Perubahan tahapan disimpan')
      setStagePic((p) => ({ ...p, [stageNumber]: undefined }))
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan')
    }
    setUpdatingStage(null)
  }

  const changeStagePicDraft = (stageNumber, picId) => {
    setStagePic((p) => ({ ...p, [stageNumber]: picId ? Number(picId) : null }))
  }

  const uploadStageDoc = (stageId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    setStageDocUploading(stageId)
    api.post(`/admin/documents/${id}/stages/${stageId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => { toast.success('Berkas berhasil diupload'); load() })
      .catch(() => toast.error('Gagal upload'))
      .finally(() => setStageDocUploading(null))
  }

  const deleteStageDoc = async (stageId, fileId) => {
    if (!window.confirm('Hapus berkas ini?')) return
    try {
      await api.delete(`/admin/documents/${id}/stages/${stageId}/documents/${fileId}`)
      toast.success('Berkas dihapus')
      load()
    } catch {}
  }

  // ===== Modal edit: Informasi Order =====
  const openEditOrder = () => {
    setEditOrderForm({
      title: doc.title || '',
      description: doc.description || '',
      priority: doc.priority || 'normal',
      deadline: doc.deadline ? String(doc.deadline).slice(0, 10) : '',
      notes: doc.notes || '',
    })
    setEditOrderOpen(true)
  }

  const saveEditOrder = async (e) => {
    e.preventDefault()
    setSavingEditOrder(true)
    try {
      await api.put(`/admin/documents/${id}`, editOrderForm)
      toast.success('Informasi order diperbarui')
      setEditOrderOpen(false)
      load()
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).forEach((msgs) => toast.error(msgs[0]))
      else toast.error(err.response?.data?.message || 'Gagal memperbarui order')
    }
    setSavingEditOrder(false)
  }

  // ===== Modal edit: Pihak / Aset =====
  const findDefByLabel = (list, label) => list.find((d) => (d.actor_type?.label ?? d.asset_type?.label ?? '') === label)

  const openEditEntity = async (kind, entity) => {
    const label = entity.actor_type?.label ?? entity.asset_type?.label ?? (kind === 'actor' ? 'Pihak' : 'Aset')
    setEditEntity({ kind, id: entity.id, label })
    setEntityData({ ...(entity.data ?? {}) })
    setEntityFiles({})
    setEntityTemplate(null)
    // Ambil template agar form mengikuti definisi field pihak / dokumen aset.
    try {
      const res = await api.get(`/admin/orders/template/${doc.type_id}`)
      const tpl = res.data
      if (kind === 'actor') {
        const def = tpl.actors.find((a) => a.actor_type?.label === label) ?? tpl.actors[0]
        setEntityTemplate({ fields: def?.fields ?? [], documents: def?.documents ?? [] })
      } else {
        const def = tpl.assets.find((a) => a.asset_type?.label === label) ?? tpl.assets[0]
        setEntityTemplate({ fields: ASSET_FIELDS, documents: def?.documents ?? [] })
      }
    } catch {
      // Fallback: form generik dari data entity.
      setEntityTemplate({ fields: [], documents: [] })
    }
  }

  const closeEditEntity = () => {
    setEditEntity(null)
    setEntityTemplate(null)
  }

  const changeEntityField = (key, val) => {
    setEntityData((prev) => {
      const data = { ...prev, [key]: val }
      // Sembunyikan data pasangan jika status bukan menikah.
      if (key === 'marital_status' && val !== 'married') {
        delete data.spouse_name
        delete data.spouse_nik
      }
      return data
    })
  }

  const addEntityFile = (docKey) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEntityFiles((prev) => ({ ...prev, [docKey]: file }))
  }

  const saveEditEntity = async (e) => {
    e.preventDefault()
    if (!editEntity) return
    setSavingEditEntity(true)
    try {
      const seg = editEntity.kind === 'actor' ? 'actors' : 'assets'
      await api.put(`/admin/orders/${id}/${seg}/${editEntity.id}`, { data: entityData })
      // Upload file baru (jika ada).
      for (const [docKey, file] of Object.entries(entityFiles)) {
        if (!file) continue
        const fd = new FormData()
        fd.append('file', file)
        if (docKey) fd.append('doc_key', docKey)
        await api.post(`/admin/orders/${id}/${seg}/${editEntity.id}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success(`${editEntity.kind === 'actor' ? 'Pihak' : 'Aset'} berhasil diperbarui`)
      closeEditEntity()
      load()
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).forEach((msgs) => toast.error(msgs[0]))
      else toast.error(err.response?.data?.message || `Gagal memperbarui ${editEntity.kind === 'actor' ? 'pihak' : 'aset'}`)
    }
    setSavingEditEntity(false)
  }

  // ===== Log aktivitas order =====
  const loadActivity = async () => {
    try {
      const res = await api.get(`/admin/documents/${id}/activity`, { params: { per_page: 30 } })
      setActivities(res.data.data ?? res.data ?? [])
      setActivitiesLoaded(true)
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
  if (!doc) return <div className="text-center text-gray-500 py-20">Order tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/documents" className="btn-secondary">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
          <p className="text-gray-500 text-sm">{doc.doc_number} · Kode: <span className="font-mono">{doc.tracking_code}</span></p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {doc.ajb_case && (
            <Link to={`/admin/ajb/${doc.ajb_case.id}`} className="btn-secondary">
              Detail Kasus AJB
            </Link>
          )}
          {doc.document_type?.sla_days > 0 && (
            <span className="badge-blue">SLA {doc.document_type.sla_days} hari</span>
          )}
          {doc.document_type?.category && (
            <span className={CATEGORY_STYLES[doc.document_type.category] ?? 'badge-gray'}>
              {CATEGORY_LABELS[doc.document_type.category] ?? doc.document_type.category}
            </span>
          )}
          <span className={STATUS_STYLES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detail */}
          <CollapsibleCard
            id="info-order"
            title="Informasi Order"
            collapsed={collapsedSections['info-order']}
            onToggle={toggleSection}
          >
            <div className="flex justify-end -mt-1 mb-3">
              <button type="button" onClick={openEditOrder} className="btn-secondary text-xs py-1 inline-flex items-center gap-1" title="Ubah data order">
                <Pencil size={13} /> Ubah
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Jenis</p><p className="font-medium">{doc.document_type?.name}</p></div>
              <div><p className="text-gray-500">Kategori Tugas</p><p className="font-medium">{doc.document_type?.category ? (CATEGORY_LABELS[doc.document_type.category] ?? doc.document_type.category) : '—'}</p></div>
              <div><p className="text-gray-500">Klien</p><p className="font-medium">{doc.client?.name ?? '—'}</p></div>
              <div><p className="text-gray-500">Dibuat oleh</p><p className="font-medium">{doc.creator?.name}</p></div>
              <div><p className="text-gray-500">Deadline</p><p className="font-medium">{doc.deadline ? new Date(doc.deadline).toLocaleDateString('id-ID') : '—'}</p></div>
              <div><p className="text-gray-500">Prioritas</p><p className="font-medium capitalize">{doc.priority}</p></div>
              <div><p className="text-gray-500">Tahapan Saat Ini</p><p className="font-medium">{doc.current_stage} / {(doc.stages ?? []).length || 5}</p></div>
            </div>
            {doc.description && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-gray-500 text-sm mb-1">Deskripsi</p><p className="text-sm">{doc.description}</p></div>}
          </CollapsibleCard>

          {/* Kelengkapan Dokumen */}
          {completeness && (
            <CollapsibleCard
              id="kelengkapan"
              title="Kelengkapan Dokumen"
              right={<span className="text-sm font-semibold text-primary-700">{completeness.percentage}%</span>}
              collapsed={collapsedSections['kelengkapan']}
              onToggle={toggleSection}
            >
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${completeness.percentage}%` }} />
              </div>
              {completeness.total_required === 0 ? (
                <p className="text-xs text-gray-400">Belum ada dokumen wajib untuk jenis ini.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    (completeness.items || []).reduce((acc, item) => {
                      ;(acc[item.group] = acc[item.group] || []).push(item)
                      return acc
                    }, {})
                  ).map(([group, items]) => (
                    <div key={group}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{group}</p>
                      <div className="space-y-1">
                        {items.map((item, idx) => {
                          const actor = group !== 'Order'
                            ? (doc.actors || []).find((a) => (a.actor_type?.label ?? 'Pihak') === group) || null
                            : null
                          const found = item.uploaded ? resolveDoc(item, group) : null
                          const previewUrl = found?.url ? storageUrl(found.url) : null
                          return (
                            <div key={item.key + '-' + idx} className={`flex flex-wrap items-center gap-2 text-xs rounded-lg p-2 ${item.uploaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                              {item.uploaded ? <CheckCircle size={14} /> : <Circle size={14} />}
                              <span className="flex-1 min-w-0">{item.label}</span>
                              {previewUrl && (
                                <a href={previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 flex-shrink-0 text-green-700 hover:underline">
                                  {isImageUrl(previewUrl)
                                    ? <img src={previewUrl} alt={item.label} className="h-8 w-8 object-cover rounded border border-gray-200" />
                                    : <><Eye size={13} /> Buka</>}
                                </a>
                              )}
                              {item.uploaded && (
                                <label className="flex items-center gap-1 text-primary-600 hover:underline cursor-pointer flex-shrink-0" title="Ubah">
                                  <RefreshCw size={13} /> Ubah
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0]
                                      if (!f) return
                                      if (found?.kind === 'actor') replaceActorDoc(found.actorId, item.key, f)
                                      else if (found?.kind === 'asset') replaceAssetDoc(found.assetId, item.key, f, null)
                                      else if (actor) replaceActorDoc(actor.id, item.key, f)
                                      else replaceOrderDoc(item.key, f)
                                    }}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  />
                                </label>
                              )}
                              {!item.uploaded && (actor || group === 'Order') && (
                                <label className="text-primary-600 hover:underline cursor-pointer whitespace-nowrap flex-shrink-0">
                                  Upload
                                  <input type="file" className="hidden" onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (!f) return
                                    if (group === 'Order') uploadDoc(`/admin/orders/${id}/documents`, f, setOrderDocUploading, item.key)
                                    else uploadDoc(`/admin/orders/${id}/actors/${actor.id}/documents`, f, setActorUploading, item.key)
                                  }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                </label>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleCard>
          )}

          {/* Pihak Terlibat */}
          {(doc.actors?.length > 0) && (
            <CollapsibleCard
              id="pihak"
              title="Pihak Terlibat"
              collapsed={collapsedSections['pihak']}
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                {doc.actors.map((actor) => (
                  <div key={actor.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-primary-700" />
                      <p className="font-medium text-sm text-gray-900">{actor.actor_type?.label ?? 'Pihak'}</p>
                      <span className="ml-auto text-xs text-gray-400">#{actor.sort_order}</span>
                      <button type="button" onClick={() => openEditEntity('actor', actor)} className="btn-secondary text-xs py-1 inline-flex items-center gap-1" title="Ubah data pihak">
                        <Pencil size={12} /> Ubah
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-sm mb-3">
                      {Object.entries(actor.data ?? {}).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-gray-400 text-xs capitalize">{k.replace(/_/g, ' ')}</p>
                          <p className="text-gray-800">{k === 'marital_status' ? (MARITAL_LABELS[v] ?? v) : String(v ?? '—')}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dokumen</p>
                      {actor.documents?.length === 0 ? (
                        <p className="text-xs text-gray-400 mb-2">Belum ada dokumen</p>
                      ) : (
                        <div className="space-y-1.5 mb-2">
                          {actor.documents.map((d) => (
                            <DocFileItem
                              key={d.id}
                              doc={d}
                              onDelete={() => deleteActorDoc(actor.id, d.id)}
                              onReplace={(file) => replaceActorDoc(actor.id, d.document_catalog?.key, file, d.id)}
                            />
                          ))}
                        </div>
                      )}
                      <label className="btn-secondary text-xs py-1 cursor-pointer">
                        <Upload size={13} /> Upload
                        <input type="file" className="hidden" onChange={(e) => uploadActorDoc(actor.id, undefined, e)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          )}

          {/* Aset */}
          {(doc.assets?.length > 0) && (
            <CollapsibleCard
              id="aset"
              title="Aset"
              collapsed={collapsedSections['aset']}
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                {doc.assets.map((asset) => (
                  <div key={asset.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Landmark size={16} className="text-primary-700" />
                      <p className="font-medium text-sm text-gray-900">{asset.asset_type?.label ?? 'Aset'}</p>
                      <span className="ml-auto text-xs text-gray-400">#{asset.sort_order}</span>
                      <button type="button" onClick={() => openEditEntity('asset', asset)} className="btn-secondary text-xs py-1 inline-flex items-center gap-1" title="Ubah data aset">
                        <Pencil size={12} /> Ubah
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-sm mb-3">
                      {Object.entries(asset.data ?? {}).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-gray-400 text-xs capitalize">{k.replace(/_/g, ' ')}</p>
                          <p className="text-gray-800">{String(v ?? '—')}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dokumen</p>
                      {asset.documents?.length === 0 ? (
                        <p className="text-xs text-gray-400 mb-2">Belum ada dokumen</p>
                      ) : (
                        <div className="space-y-1.5 mb-2">
                          {asset.documents.map((d) => (
                            <DocFileItem
                              key={d.id}
                              doc={d}
                              onDelete={() => deleteAssetDoc(asset.id, d.id)}
                              onReplace={(file) => replaceAssetDoc(asset.id, d.document_catalog?.key, file, d.id)}
                            />
                          ))}
                        </div>
                      )}
                      <label className="btn-secondary text-xs py-1 cursor-pointer">
                        <Upload size={13} /> Upload
                        <input type="file" className="hidden" onChange={(e) => uploadAssetDoc(asset.id, undefined, e)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          )}

          {/* Timeline / Stages — selalu terbuka (tidak bisa dilipat) */}
          <CollapsibleCard id="timeline" title="Timeline Proses" alwaysOpen>
            <div className="space-y-4">
              {(doc.stages ?? []).map((stage, i) => (
                <div key={stage.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {STAGE_STATUS_ICON[stage.status]}
                      {i < (doc.stages.length - 1) && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {stage.stage_name}
                            {stage.sla_days > 0 && (
                              <span className="ml-2 text-xs font-normal text-gray-400">SLA {stage.sla_days} hr</span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            {stage.started_at && (
                              <p className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar size={12} /> Mulai: {new Date(stage.started_at).toLocaleString('id-ID')}
                              </p>
                            )}
                            {stage.completed_at && (
                              <p className="flex items-center gap-1 text-xs text-green-600">
                                <Calendar size={12} /> Selesai: {new Date(stage.completed_at).toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                            {stage.pic && stage.status === 'completed' && (
                              <p className="text-xs text-gray-500">
                                PIC: <span className="font-medium text-green-700">{stage.pic.name}</span>
                              </p>
                            )}
                            {stage.notes && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                <span className="font-medium">Catatan:</span> <span className="italic">{stage.notes}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Riwayat PIC & PIC aktif */}
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <History size={12} /> PIC
                        </p>
                        {stage.pic_history?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {stage.pic_history.map((h) => (
                              <span
                                key={h.id}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                  h.user_id === stage.pic_id
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}
                                title={h.action === 'transferred' ? 'Pindah tugas' : 'Penugasan awal'}
                              >
                                {h.user?.name ?? '—'}
                                <span className="text-gray-400 font-normal">
                                  {h.action === 'transferred' ? '· pindah tugas' : '· ditugaskan'}
                                  {h.assigned_at ? ` · ${new Date(h.assigned_at).toLocaleDateString('id-ID')}` : ''}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            {stage.pic?.name ?? stage.handler?.name ?? 'Belum ada PIC'}
                          </p>
                        )}
                        {stage.status === 'completed' && stage.pic && (
                          <p className="text-xs text-gray-500 mt-1">
                            PIC saat ini: <span className="font-medium text-green-700">{stage.pic.name}</span>
                          </p>
                        )}
                      </div>

                      {/* Form edit utk stage belum selesai */}
                      {stage.status !== 'completed' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-52">
                              <label className="text-xs text-gray-500 font-medium block mb-0.5">Catatan:</label>
                              <input
                                className="input text-xs py-1 px-2 w-full"
                                placeholder="Tulis catatan proses..."
                                value={stageNotes[stage.stage_number] ?? stage.notes ?? ''}
                                onChange={(e) => setStageNotes({ ...stageNotes, [stage.stage_number]: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-0.5">PIC:</label>
                              <select
                                className="input text-xs py-1 w-auto"
                                value={stagePic[stage.stage_number] ?? stage.pic_id ?? ''}
                                onChange={(e) => changeStagePicDraft(stage.stage_number, e.target.value)}
                              >
                                <option value="">Pilih PIC...</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setTransferOpen((t) => ({ ...t, [stage.stage_number]: !t[stage.stage_number] }))}
                                disabled={!!updatingStage}
                                className="btn-secondary text-xs py-1 inline-flex items-center gap-1"
                                title="Pindah Tugas"
                              >
                                <UserPlus size={13} /> Pindah Tugas
                              </button>
                              <button
                                onClick={() => handleSaveStage(stage.stage_number)}
                                disabled={!!updatingStage}
                                className="btn-primary text-xs py-1 inline-flex items-center gap-1"
                                title="Simpan catatan & PIC"
                              >
                                <Save size={13} /> Simpan
                              </button>
                              {stage.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStage(stage.stage_number, 'in_progress')}
                                  disabled={!!updatingStage}
                                  className="btn-secondary text-xs py-1"
                                >
                                  Mulai Proses
                                </button>
                              )}
                              {stage.status === 'in_progress' && (
                                <button
                                  onClick={() => handleUpdateStage(stage.stage_number, 'completed')}
                                  disabled={!!updatingStage}
                                  className="btn-secondary text-xs py-1"
                                >
                                  Tandai Selesai
                                </button>
                              )}
                            </div>
                          </div>
                          {transferOpen[stage.stage_number] && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                              <p className="text-xs font-medium text-gray-500 mb-1.5">Pilih PIC pengganti:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {employees.filter((emp) => emp.id !== (stagePic[stage.stage_number] ?? stage.pic_id)).map((emp) => (
                                  <button
                                    key={emp.id}
                                    onClick={() => { changeStagePicDraft(stage.stage_number, emp.id); setTransferOpen((t) => ({ ...t, [stage.stage_number]: false })) }}
                                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white hover:border-primary-400 hover:text-primary-700 text-gray-700"
                                  >
                                    {emp.name} ({emp.role})
                                  </button>
                                ))}
                                {employees.length === 0 && <p className="text-xs text-gray-400">Tidak ada pegawai lain</p>}
                              </div>
                              <p className="text-xs text-gray-400 mt-1.5">Pilihan akan diterapkan setelah menekan <span className="font-medium">Simpan</span>.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Berkas Pendukung Tahapan */}
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Berkas Pendukung</p>
                        {(stage.documents?.length > 0) ? (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {stage.documents.map((sd) => (
                              <div key={sd.id} className="relative group flex items-center gap-1.5 bg-gray-50 rounded-lg p-1.5 pr-2">
                                {isImageUrl(sd.url)
                                  ? <img src={storageUrl(sd.url)} alt={sd.original_name} className="h-8 w-8 object-cover rounded" />
                                  : <Image size={16} className="text-gray-400" />}
                                <span className="text-xs text-gray-700 truncate max-w-32">{sd.original_name}</span>
                                <a href={storageUrl(sd.url)} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">Buka</a>
                                <button onClick={() => deleteStageDoc(stage.id, sd.id)} className="text-red-400 hover:text-red-600" title="Hapus">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mb-2">Belum ada berkas</p>
                        )}
                        <label className="btn-secondary text-xs py-1 px-2 cursor-pointer inline-flex items-center gap-1">
                          <Plus size={12} /> Tambah
                          {stageDocUploading === stage.id && <span className="ml-1">...</span>}
                          <input type="file" className="hidden" onChange={(e) => uploadStageDoc(stage.id, e)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={stageDocUploading === stage.id} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Client info */}
          {doc.client && (
            <CollapsibleCard
              id="klien"
              title="Informasi Klien"
              collapsed={collapsedSections['klien']}
              onToggle={toggleSection}
            >
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Nama: </span>{doc.client.name}</p>
                <p><span className="text-gray-500">Telp: </span>{doc.client.phone ?? '—'}</p>
                <p><span className="text-gray-500">Email: </span>{doc.client.email ?? '—'}</p>
              </div>
              <Link to={`/admin/clients/${doc.client.id}`} className="btn-secondary w-full justify-center mt-3 text-xs">
                Lihat Profil Klien
              </Link>
            </CollapsibleCard>
          )}

          {/* Log aktivitas perubahan data order */}
          <CollapsibleCard
            id="log"
            title="Log Aktivitas"
            right={<Activity size={15} className="text-primary-700" />}
            collapsed={collapsedSections['log']}
            onToggle={toggleSection}
          >
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada aktivitas perubahan data.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activities.map((log) => (
                  <div key={log.id} className="flex gap-2 text-xs">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-gray-800 leading-snug">{log.description || `${log.action} ${log.module}`}</p>
                      <p className="text-gray-400 mt-0.5">
                        {log.user?.name ?? 'System'} · {new Date(log.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>
        </div>
      </div>

      {/* ===== Modal edit Informasi Order ===== */}
      {editOrderOpen && (
        <EditModal
          title="Ubah Informasi Order"
          onClose={() => setEditOrderOpen(false)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditOrderOpen(false)}>Batal</button>
              <button type="submit" form="form-edit-order" disabled={savingEditOrder} className="btn-primary">
                <Save size={16} /> {savingEditOrder ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </>
          }
        >
          <form id="form-edit-order" onSubmit={saveEditOrder} className="space-y-4">
            <div>
              <label className="label">Judul Order <span className="text-red-500">*</span></label>
              <input className="input" value={editOrderForm.title} onChange={(e) => setEditOrderForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Prioritas</label>
                <select className="input" value={editOrderForm.priority} onChange={(e) => setEditOrderForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Rendah</option>
                  <option value="normal">Normal</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" value={editOrderForm.deadline} onChange={(e) => setEditOrderForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Deskripsi</label>
              <textarea className="input h-24 resize-none" value={editOrderForm.description} onChange={(e) => setEditOrderForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Catatan Internal</label>
              <textarea className="input h-20 resize-none" value={editOrderForm.notes} onChange={(e) => setEditOrderForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </form>
        </EditModal>
      )}

      {/* ===== Modal edit Pihak / Aset ===== */}
      {editEntity && (
        <EditModal
          title={`Ubah ${editEntity.kind === 'actor' ? 'Pihak' : 'Aset'}: ${editEntity.label}`}
          onClose={closeEditEntity}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={closeEditEntity}>Batal</button>
              <button type="submit" form="form-edit-entity" disabled={savingEditEntity} className="btn-primary">
                <Save size={16} /> {savingEditEntity ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </>
          }
        >
          <form id="form-edit-entity" onSubmit={saveEditEntity} className="space-y-4">
            {editEntity.kind === 'actor' ? (
              <>
                {(!entityTemplate || entityTemplate.fields?.length === 0) && (
                  <p className="text-sm text-gray-400">Template tidak mendefinisikan field; ubah lewat data mentah di bawah.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(entityTemplate?.fields ?? [])
                    .filter((f) => !['spouse_name', 'spouse_nik'].includes(f.key) || entityData['marital_status'] === 'married')
                    .map((f) => (
                      <div key={f.key} className={f.data_type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="label">
                          {f.label} {f.is_required && <span className="text-red-500">*</span>}
                        </label>
                        <FieldInput field={f} value={entityData[f.key]} onChange={(v) => changeEntityField(f.key, v)} />
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(entityTemplate?.fields ?? ASSET_FIELDS).map((f) => (
                  <div key={f.key} className={f.data_type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="label">{f.label}</label>
                    <FieldInput field={f} value={entityData[f.key]} onChange={(v) => changeEntityField(f.key, v)} />
                  </div>
                ))}
              </div>
            )}

            {/* Upload dokumen tambahan (pihak/aset) */}
            {entityTemplate?.documents?.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upload Dokumen</p>
                <div className="space-y-2">
                  {entityTemplate.documents
                    .filter((d) => (d.key !== 'ktp_pasangan' && d.key !== 'npwp_pasangan') || entityData['marital_status'] === 'married')
                    .map((d) => {
                      const file = entityFiles[d.key]
                      return (
                        <label key={d.key} className="flex items-center gap-2 text-sm p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${d.is_required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {d.is_required ? 'WAJIB' : 'Opsional'}
                          </span>
                          <span className="flex-1 font-medium text-gray-700 text-sm">{d.label}</span>
                          {file && <span className="text-xs text-green-700 truncate max-w-40">{file.name}</span>}
                          <span className="btn-secondary text-xs py-1 px-2 whitespace-nowrap">{file ? 'Ganti' : 'Pilih File'}</span>
                          <input type="file" className="hidden" onChange={addEntityFile(d.key)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                        </label>
                      )
                    })}
                </div>
                <p className="text-xs text-gray-400 mt-2">File yang sudah ada tidak diubah kecuali dihapus dari bagian dokumen di bawah.</p>
              </div>
            )}
          </form>
        </EditModal>
      )}
    </div>
  )
}
