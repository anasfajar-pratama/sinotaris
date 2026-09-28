import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, User, Landmark, FileText, FolderOpen,
  ChevronDown, CheckCircle2, Lock, Users, Plus, Trash2, Building2, UserCheck,
  X, UserPlus,
} from 'lucide-react'

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

const HANDLER_TYPES = [
  { value: 'notaris', label: 'Notaris', icon: UserCheck },
  { value: 'ppat', label: 'PPAT', icon: Landmark },
  { value: 'ppat_rekanan', label: 'PPAT Rekanan', icon: Building2 },
]

function DocRow({ doc, file, onChoose }) {
  const isImage = file && file.type && file.type.startsWith('image/')
  const [preview, setPreview] = useState('')
  useEffect(() => {
    if (!isImage) { setPreview(''); return }
    const u = URL.createObjectURL(file)
    setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [file, isImage])

  return (
    <div className="flex items-start gap-2 text-sm p-2 border border-gray-200 rounded-lg">
      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${doc.is_required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
        {doc.is_required ? 'WAJIB' : 'Opsional'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{doc.label}</p>
        {file && (
          <div className="flex items-center gap-2 mt-1">
            {preview
              ? <img src={preview} alt={doc.label} className="h-12 w-16 object-cover rounded border border-gray-300 shrink-0" />
              : <FileText size={20} className="text-blue-500 shrink-0" />
            }
            <p className="text-xs text-green-700 font-medium truncate">{file.name}</p>
          </div>
        )}
      </div>
      <label className="btn-secondary text-xs py-1 px-3 cursor-pointer whitespace-nowrap shrink-0 mt-0.5">
        {file ? 'Ganti' : 'Upload'}
        <input type="file" className="hidden" onChange={onChoose} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      </label>
    </div>
  )
}

function DocTable({ docs, files, onAdd }) {
  return (
    <div className="space-y-2">
      {docs.map((d) => {
        const file = files?.[d.key]
        return <DocRow key={d.key} doc={d} file={file} onChoose={onAdd(d.key)} />
      })}
    </div>
  )
}

// 3 section yang tampil sebagai card menu.
const SECTION_META = [
  { key: 'order',   title: 'Jenis & Informasi Order', desc: 'Pilih jenis order, klien, dan informasi dasar dokumen', icon: FolderOpen },
  { key: 'parties', title: 'Pihak Terlibat',           desc: 'Data penjual, pembeli, saksi, dan pihak lainnya',       icon: Users },
  { key: 'assets',  title: 'Aset / Objek',             desc: 'Sertifikat tanah / objek yang menjadi dasar order',      icon: Landmark },
]

// Komponen card-section (top-level agar tidak remount tiap render input).
function SectionCard({ meta, index, done, active, locked, onToggle, children }) {
  const Icon = meta.icon
  return (
    <section className={`card overflow-hidden ${active ? 'ring-2 ring-primary-200' : ''} ${locked ? 'opacity-70' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={locked}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100 text-green-600' : locked ? 'bg-gray-100 text-gray-400' : 'bg-primary-100 text-primary-700'}`}>
          {done ? <CheckCircle2 size={22} /> : <Icon size={22} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{index + 1}</span>
            {meta.title}
            {locked && <span className="text-xs font-normal text-gray-400 flex items-center gap-1"><Lock size={12} /> Simpan Order dulu</span>}
          </h2>
          <p className="text-sm text-gray-500">{meta.desc}</p>
        </div>
        <ChevronDown className={`text-gray-400 transition-transform shrink-0 ${active ? 'rotate-180' : ''}`} />
      </button>
      {active && <div className="border-t border-gray-100">{children}</div>}
    </section>
  )
}

export default function AdminDocumentCreate() {
  const navigate = useNavigate()
  const [types, setTypes] = useState([])
  const [clients, setClients] = useState([])
  const [kategori, setKategori] = useState('') // 'notaris' | 'ppat'
  const [template, setTemplate] = useState(null)
  const [docId, setDocId] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [openSection, setOpenSection] = useState('order')
  const [form, setForm] = useState({
    type_id: '', client_id: '', title: '', description: '',
    priority: 'normal', deadline: '', notes: '',
    handler_type: '', handler_name: '', handler_region: '',
  })
  const [actors, setActors] = useState([])
  const [assets, setAssets] = useState([])
  const [savingAll, setSavingAll] = useState(false)
  const [addActorPicker, setAddActorPicker] = useState(false)

  const orderSaved = !!docId

  // Muat jenis order & klien untuk card 1.
  useEffect(() => {
    const load = async () => {
      const [typesRes, clientsRes] = await Promise.allSettled([
        api.get('/admin/settings/document-types'),
        api.get('/admin/clients', { params: { per_page: 100 } }),
      ])
      if (typesRes.status === 'fulfilled') {
        setTypes(typesRes.value.data.types ?? typesRes.value.data)
      } else {
        toast.error('Gagal memuat daftar jenis order')
      }
      if (clientsRes.status === 'fulfilled') {
        setClients(clientsRes.value.data.data ?? [])
      } else {
        toast.error('Gagal memuat daftar klien')
      }
    }
    load()
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Pilih kategori tugas (Notaris/PPAT) -> reset pilihan jenis order.
  const selectKategori = (kat) => {
    setKategori(kat)
    set('type_id', '')
    setTemplate(null)
    setActors([])
    setAssets([])
  }

  // Jenis order yang tersedia sesuai kategori terpilih.
  const filteredTypes = kategori ? types.filter((t) => t.category === kategori) : types

  // Pilih jenis order -> muat template (actor/aset/referensi dokumen).
  const onTypeChange = async (typeId) => {
    set('type_id', typeId)
    setTemplate(null)
    setActors([])
    setAssets([])
    if (!typeId) return
    try {
      const res = await api.get(`/admin/orders/template/${typeId}`)
      setTemplate(res.data)
      setActors(res.data.actors.map((def) => ({ def, data: {}, files: {}, id: null, saved: false, saving: false })))
      setAssets(res.data.assets.map((def) => ({ def, data: {}, files: {}, id: null, saved: false, saving: false })))
    } catch {}
  }

  // ==== Card 1: buat order dasar ====
  const saveOrder = async (e) => {
    e.preventDefault()
    if (!form.type_id || !form.client_id || !form.title) {
      toast.error('Harap isi semua field wajib')
      return
    }
    setSavingOrder(true)
    try {
      const res = await api.post('/admin/documents', form)
      setDocId(res.data.document.id)
      toast.success('Order berhasil dibuat. Lanjut isi pihak, aset & berkas.')
      setOpenSection('parties')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).forEach((msgs) => toast.error(msgs[0]))
      else toast.error(err.response?.data?.message || 'Gagal membuat order')
    }
    setSavingOrder(false)
  }

  // ==== Card 2 & 3: simpan satu entitas (actor/aset) ====
  // Mengembalikan true jika sukses, false jika gagal/diblokir (dipakai auto-save).
  const saveEntity = async (kind, i) => {
    const list = kind === 'actors' ? actors : assets
    const entity = list[i]
    if (!entity || entity.saving) return false
    if (!docId) { toast.error('Simpan dulu card Order'); return false }

    // Validasi field wajib dari template.
    const isPt = kind === 'actors' && entity.data?.actor_kind === 'pt'
    if (isPt) {
      if (!entity.data?.company_name) { toast.error('Lengkapi field wajib: Nama Perusahaan (PT)'); return false }
    } else {
      const required = (entity.def?.fields || []).filter((f) => f.is_required)
      const missing = required.find((f) => !entity.data[f.key])
      if (missing) { toast.error(`Lengkapi field wajib: ${missing.label}`); return false }
    }

    const seg = kind === 'actors' ? 'actors' : 'assets'
    const setSaving = (val) => {
      const fn = kind === 'actors' ? setActors : setAssets
      fn((arr) => arr.map((a, idx) => (idx === i ? { ...a, saving: val } : a)))
    }
    setSaving(true)

    try {
      let id = entity.id
      if (id) {
        await api.put(`/admin/orders/${docId}/${seg}/${id}`, { data: entity.data })
        toast.success(`${kind === 'actors' ? 'Pihak' : 'Aset'} berhasil diperbarui`)
      } else {
        const typeKey = kind === 'actors' ? entity.def.actor_type.key : entity.def.asset_type.key
        const res = await api.post(`/admin/orders/${docId}/${seg}`, {
          [`${kind === 'actors' ? 'actor' : 'asset'}_type_key`]: typeKey,
          data: entity.data,
        })
        id = res.data[kind === 'actors' ? 'actor' : 'asset'].id
        toast.success(`${kind === 'actors' ? 'Pihak' : 'Aset'} berhasil disimpan`)
      }
      const fn = kind === 'actors' ? setActors : setAssets
      fn((arr) => arr.map((a, idx) => (idx === i ? { ...a, id, saved: true, saving: false } : a)))
      await uploadEntityFiles(kind, docId, id, entity.files)
      return true
    } catch (err) {
      setSaving(false)
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).forEach((msgs) => toast.error(msgs[0]))
      else toast.error(err.response?.data?.message || `Gagal menyimpan ${kind === 'actors' ? 'pihak' : 'aset'}`)
      return false
    }
  }

  // Upload semua berkas draft milik entitas (dipanggil setelah entitas tersimpan).
  const uploadEntityFiles = async (kind, documentId, entityId, files) => {
    const seg = kind === 'actors' ? 'actors' : 'assets'
    for (const [dkey, file] of Object.entries(files || {})) {
      if (!file) continue
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_key', dkey)
      try {
        await api.post(`/admin/orders/${documentId}/${seg}/${entityId}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch {}
    }
  }

  const setEntityData = (kind, i, key, val) => {
    const fn = kind === 'actors' ? setActors : setAssets
    fn((arr) => arr.map((a, idx) => {
      if (idx !== i) return a
      const data = { ...a.data, [key]: val }
      // Jika actor_kind berubah, reset data sesuai jenis
      if (key === 'actor_kind') {
        if (val === 'pt') {
          return { ...a, data: { actor_kind: 'pt', company_name: '', company_id: '', npwp: '', company_address: '', phone: '' }, files: {} }
        } else {
          return { ...a, data: { actor_kind: 'perorangan' }, files: {} }
        }
      }
      // Jika status perkawinan bukan menikah, hapus data pasangan & file pasangan.
      if (key === 'marital_status' && !['married', 'married_foreign', 'married_prenup'].includes(val)) {
        delete data.spouse_name
        delete data.spouse_nik
        const files = { ...a.files }
        delete files.ktp_pasangan
        delete files.npwp_pasangan
        return { ...a, data, files }
      }
      return { ...a, data }
    }))
  }
  const setEntityFile = (kind, i, docKey) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fn = kind === 'actors' ? setActors : setAssets
    fn((arr) => arr.map((a, idx) => (idx === i ? { ...a, files: { ...a.files, [docKey]: file } } : a)))
  }

  const removeEntity = async (kind, i) => {
    const list = kind === 'actors' ? actors : assets
    const entity = list[i]
    if (!entity) return
    if (entity.id && docId) {
      const seg = kind === 'actors' ? 'actors' : 'assets'
      try {
        await api.delete(`/admin/orders/${docId}/${seg}/${entity.id}`)
      } catch {}
    }
    const fn = kind === 'actors' ? setActors : setAssets
    fn((arr) => arr.filter((_, idx) => idx !== i))
    toast.success(`${kind === 'actors' ? 'Pihak' : 'Aset'} dihapus`)
  }

  const addActorWithDef = (def) => {
    setActors((arr) => [...arr, { def, data: {}, files: {}, id: null, saved: false, saving: false }])
    setAddActorPicker(false)
  }
  const addActor = () => {
    if (!template?.actors?.length) return
    if (template.actors.length === 1) {
      addActorWithDef(template.actors[0])
      return
    }
    // Lebih dari satu tipe pihak di template → biarkan user memilih.
    setAddActorPicker(true)
  }
  const addAsset = () => {
    if (!template?.assets?.length) return
    const def = template.assets[0]
    setAssets((arr) => [...arr, { def, data: {}, files: {}, id: null, saved: false, saving: false }])
  }

  // Tombol "Selesai": auto-save semua entitas draft yang sudah diisi (data tidak
  // kosong) sebelum pindah ke detail — menyamakan perilaku lama yang menyimpan
  // semua sekaligus, agar isian pihak/aset tidak hilang.
  const finishCreate = async () => {
    if (!docId || savingAll) return
    const pending = [
      ...actors.map((e, i) => ({ kind: 'actors', i, e })),
      ...assets.map((e, i) => ({ kind: 'assets', i, e })),
    ].filter(({ e }) => !e.saved && Object.keys(e.data).length > 0)

    if (pending.length === 0) {
      navigate(`/admin/documents/${docId}`)
      return
    }

    setSavingAll(true)
    toast(`Menyimpan ${pending.length} data yang belum disimpan...`)
    for (const { kind, i } of pending) {
      const ok = await saveEntity(kind, i)
      if (!ok) {
        setSavingAll(false)
        return // hentikan, jangan pindah kalau ada yang gagal
      }
    }
    setSavingAll(false)
    navigate(`/admin/documents/${docId}`)
  }

  // ==== Status kelengkapan tiap section (untuk stepper & ikon) ====
  const sectionCompleted = (key) => {
    if (key === 'order') return orderSaved
    if (key === 'parties') return actors.length > 0 && actors.every((a) => a.saved)
    if (key === 'assets') return assets.length > 0 && assets.every((a) => a.saved)
    return false
  }

  const toggleSection = (key) => {
    if (!orderSaved && key !== 'order') {
      toast('Simpan dulu card Order sebelum melanjutkan', { icon: '🔒' })
      return
    }
    setOpenSection((cur) => (cur === key ? null : key))
  }

  const orderFilled = !!form.type_id && !!form.client_id && !!form.title

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/documents" className="btn-secondary"><ArrowLeft size={16} /> Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Order Baru</h1>
      </div>

      {/* Stepper ringkas */}
      <div className="flex flex-wrap gap-2">
        {SECTION_META.map((s, idx) => {
          const done = sectionCompleted(s.key)
          const active = openSection === s.key
          const locked = !orderSaved && s.key !== 'order'
          const Icon = s.icon
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSection(s.key)}
              disabled={locked}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                active
                  ? 'border-primary-700 bg-primary-50 text-primary-800 font-semibold'
                  : done
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : locked
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : locked ? <Lock size={14} /> : <Icon size={14} />}
              {s.title}
            </button>
          )
        })}
      </div>

      {/* ===== CARD 1: ORDER ===== */}
      <SectionCard
        meta={SECTION_META[0]}
        index={0}
        done={sectionCompleted('order')}
        active={openSection === 'order'}
        locked={false}
        onToggle={() => toggleSection('order')}
      >
        {orderSaved ? (
          <div className="p-6 flex items-center justify-between flex-wrap gap-3 bg-green-50/60">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <CheckCircle2 size={18} />
              Order berhasil dibuat. Silakan lanjut ke card Pihak, Aset, dan Berkas.
            </div>
            <button type="button" className="btn-primary" onClick={() => setOpenSection('parties')}>
              Lanjut ke Pihak →
            </button>
          </div>
        ) : (
          <form onSubmit={saveOrder} className="p-6 space-y-5">
            {/* Pilihan kategori tugas: Notaris / PPAT */}
            <div>
              <label className="label">Kategori Tugas <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'notaris', icon: FileText, title: 'Notaris', desc: 'Akta & perbuatan hukum umum (PT, waris, wasiat, pranikah, PPJB, dll.)' },
                  { value: 'ppat', icon: Landmark, title: 'PPAT', desc: 'Akta pertanahan (jual beli tanah, hibah tanah, hak tanggungan)' },
                ].map((o) => {
                  const Icon = o.icon
                  const active = kategori === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => selectKategori(o.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                        active ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{o.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{o.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Jenis Order <span className="text-red-500">*</span></label>
                <select
                  className="input"
                  value={form.type_id}
                  onChange={(e) => onTypeChange(e.target.value)}
                  required
                  disabled={!kategori}
                >
                  <option value="">{kategori ? 'Pilih jenis...' : 'Pilih kategori tugas dulu'}</option>
                  {filteredTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {kategori && filteredTypes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Belum ada jenis order untuk kategori ini.</p>
                )}
              </div>
              <div>
                <label className="label">Nasabah <span className="text-red-500">*</span></label>
                <select className="input" value={form.client_id} onChange={(e) => set('client_id', e.target.value)} required>
                  <option value="">Pilih nasabah...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Judul Order <span className="text-red-500">*</span></label>
              <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Judul order..." required />
            </div>

            {form.type_id && !template && <p className="text-sm text-gray-500 animate-pulse">Memuat template...</p>}

            <div>
              <label className="label">Deskripsi</label>
              <textarea className="input h-24 resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Deskripsi order..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Prioritas</label>
                <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                  <option value="low">Rendah</option>
                  <option value="normal">Normal</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Catatan Internal</label>
              <textarea className="input h-20 resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Catatan internal..." />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="label">Pejabat Pembuat Akta</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {HANDLER_TYPES.map((o) => {
                  const Icon = o.icon
                  const active = form.handler_type === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set('handler_type', o.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                        active ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-primary-700' : 'text-gray-500'} />
                      <span className={`text-sm font-medium ${active ? 'text-primary-700' : 'text-gray-700'}`}>{o.label}</span>
                    </button>
                  )
                })}
              </div>
              {form.handler_type && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nama {HANDLER_TYPES.find(h => h.value === form.handler_type)?.label}</label>
                    <input className="input" value={form.handler_name} onChange={(e) => set('handler_name', e.target.value)} placeholder="Nama pejabat..." />
                  </div>
                  <div>
                    <label className="label">Wilayah Kerja</label>
                    <input className="input" value={form.handler_region} onChange={(e) => set('handler_region', e.target.value)} placeholder="Wilayah kerja..." />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={savingOrder || !orderFilled} className="btn-primary">
                <Save size={16} /> {savingOrder ? 'Menyimpan...' : 'Simpan Order'}
              </button>
              <Link to="/admin/documents" className="btn-secondary">Batal</Link>
            </div>
          </form>
        )}
      </SectionCard>

      {/* ===== CARD 2: PIHAK ===== */}
      <SectionCard
        meta={SECTION_META[1]}
        index={1}
        done={sectionCompleted('parties')}
        active={openSection === 'parties'}
        locked={!orderSaved}
        onToggle={() => toggleSection('parties')}
      >
        {orderSaved && (
          <div className="p-6 space-y-4">
            {actors.length === 0 ? (
              <p className="text-sm text-gray-400">Template jenis order ini tidak mendefinisikan pihak.</p>
            ) : (
              actors.map((actor, i) => {
                const saved = !!actor.id
                const actorKind = actor.data.actor_kind || 'perorangan'
                const maritalStatus = actor.data.marital_status
                const isPembeli = actor.def.actor_type.key === 'pembeli'
                const isMarried = ['married', 'married_foreign', 'married_prenup'].includes(maritalStatus)

                // Get dynamic docs based on marital status (dedup: exclude keys already in base docs)
                const baseDocKeys = new Set((actor.def.documents || []).map(d => d.key))
                const maritalDocs = maritalStatus && template?.marital_docs?.[maritalStatus]
                  ? template.marital_docs[maritalStatus].filter(d => !baseDocKeys.has(d.key))
                  : []

                // PT docs
                const ptDocs = actorKind === 'pt' && template?.pt_docs ? template.pt_docs : []

                return (
                  <div key={`actor-${i}`} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User size={18} className="text-primary-700" />
                      <h3 className="text-base font-semibold text-gray-900">{actor.def.actor_type.label}</h3>
                      {actor.def.is_required && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">WAJIB</span>}
                      {saved && <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> Tersimpan</span>}
                      {saved && (
                        <button type="button" className="ml-auto text-xs text-red-500 hover:underline inline-flex items-center gap-1" onClick={() => removeEntity('actors', i)}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      )}
                    </div>

                    {/* Actor Kind Toggle */}
                    {!saved && (
                      <div className="mb-4">
                        <label className="label">Jenis Pihak</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEntityData('actors', i, 'actor_kind', 'perorangan')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                              actorKind === 'perorangan' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <User size={14} className="inline mr-1" /> Perorangan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntityData('actors', i, 'actor_kind', 'pt')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                              actorKind === 'pt' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Building2 size={14} className="inline mr-1" /> Perusahaan (PT)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Gunakan Data Nasabah button for Pembeli */}
                    {isPembeli && !saved && form.client_id && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">Gunakan data nasabah yang sudah terdaftar?</p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await api.post(`/admin/orders/${docId}/actors/from-client`, {
                                client_id: form.client_id,
                                actor_type_key: 'pembeli',
                              })
                              const newActor = res.data.actor
                              setActors((arr) => arr.map((a, idx) => idx === i ? {
                                ...a,
                                id: newActor.id,
                                data: newActor.data,
                                saved: true,
                              } : a))
                              toast.success('Data nasabah berhasil dimuat')
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Gagal memuat data nasabah')
                            }
                          }}
                          className="btn-secondary text-sm"
                        >
                          <UserCheck size={14} className="inline mr-1" /> Gunakan Data Nasabah
                        </button>
                      </div>
                    )}

                    {/* Perorangan fields */}
                    {actorKind === 'perorangan' && actor.def.fields?.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {actor.def.fields
                          .filter((f) => !['spouse_name', 'spouse_nik'].includes(f.key) || isMarried)
                          .map((f) => (
                          <div key={f.key}>
                            <label className="label">
                              {f.label} {f.is_required && <span className="text-red-500">*</span>}
                            </label>
                            <FieldInput field={f} value={actor.data[f.key]} onChange={(v) => setEntityData('actors', i, f.key, v)} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PT fields */}
                    {actorKind === 'pt' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label">Nama Perusahaan (PT) <span className="text-red-500">*</span></label>
                          <input className="input" value={actor.data.company_name || ''} onChange={(e) => setEntityData('actors', i, 'company_name', e.target.value)} placeholder="Nama PT..." />
                        </div>
                        <div>
                          <label className="label">NIB (Nomor Induk Berusaha)</label>
                          <input className="input" value={actor.data.company_id || ''} onChange={(e) => setEntityData('actors', i, 'company_id', e.target.value)} placeholder="NIB..." />
                        </div>
                        <div>
                          <label className="label">NPWP Perusahaan</label>
                          <input className="input" value={actor.data.npwp || ''} onChange={(e) => setEntityData('actors', i, 'npwp', e.target.value)} placeholder="NPWP PT..." />
                        </div>
                        <div>
                          <label className="label">No. Telepon / WhatsApp</label>
                          <input className="input" value={actor.data.phone || ''} onChange={(e) => setEntityData('actors', i, 'phone', e.target.value)} placeholder="No. telepon..." />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Alamat Perusahaan</label>
                          <textarea className="input h-20 resize-none" value={actor.data.company_address || ''} onChange={(e) => setEntityData('actors', i, 'company_address', e.target.value)} placeholder="Alamat perusahaan..." />
                        </div>
                      </div>
                    )}

                    {/* Base documents from template */}
                    {actorKind === 'perorangan' && actor.def.documents?.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dokumen Dasar</p>
                        <DocTable docs={actor.def.documents} files={actor.files} onAdd={(docKey) => setEntityFile('actors', i, docKey)} />
                      </div>
                    )}

                    {/* Marital status-based documents */}
                    {actorKind === 'perorangan' && maritalDocs.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dokumen Berdasarkan Status Perkawinan</p>
                        <DocTable docs={maritalDocs} files={actor.files} onAdd={(docKey) => setEntityFile('actors', i, docKey)} />
                      </div>
                    )}

                    {/* PT documents */}
                    {actorKind === 'pt' && ptDocs.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dokumen Perusahaan</p>
                        <DocTable docs={ptDocs} files={actor.files} onAdd={(docKey) => setEntityFile('actors', i, docKey)} />
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button type="button" disabled={actor.saving} className="btn-primary" onClick={() => saveEntity('actors', i)}>
                        <Save size={16} /> {actor.saving ? 'Menyimpan...' : saved ? 'Perbarui & Simpan' : 'Simpan Pihak'}
                      </button>
                      {!saved && (
                        <button type="button" className="btn-secondary" onClick={() => removeEntity('actors', i)}>Buang</button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {template?.actors?.length > 0 && (
              <button type="button" className="btn-secondary" onClick={addActor}>
                <Plus size={16} /> Tambah Pihak Lain
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* ===== CARD 3: ASET ===== */}
      <SectionCard
        meta={SECTION_META[2]}
        index={2}
        done={sectionCompleted('assets')}
        active={openSection === 'assets'}
        locked={!orderSaved}
        onToggle={() => toggleSection('assets')}
      >
        {orderSaved && (
          <div className="p-6 space-y-4">
            {assets.length === 0 ? (
              <p className="text-sm text-gray-400">Template jenis order ini tidak mendefinisikan aset.</p>
            ) : (
              assets.map((asset, i) => {
                const saved = !!asset.id
                return (
                  <div key={`asset-${i}`} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Landmark size={18} className="text-primary-700" />
                      <h3 className="text-base font-semibold text-gray-900">{asset.def.asset_type.label}</h3>
                      {asset.def.is_required && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">WAJIB</span>}
                      {saved && <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> Tersimpan</span>}
                      {saved && (
                        <button type="button" className="ml-auto text-xs text-red-500 hover:underline inline-flex items-center gap-1" onClick={() => removeEntity('assets', i)}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="label">Nomor Sertifikat</label>
                        <input className="input" value={asset.data.sertifikat_no || ''} onChange={(e) => setEntityData('assets', i, 'sertifikat_no', e.target.value)} placeholder="Nomor sertifikat..." />
                      </div>
                      <div>
                        <label className="label">Luas Tanah (m²)</label>
                        <input className="input" value={asset.data.luas || ''} onChange={(e) => setEntityData('assets', i, 'luas', e.target.value)} placeholder="Luas tanah..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label">Alamat &amp; Lokasi Tanah</label>
                        <textarea className="input h-20 resize-none" value={asset.data.lokasi || ''} onChange={(e) => setEntityData('assets', i, 'lokasi', e.target.value)} placeholder="Alamat tanah..." />
                      </div>
                    </div>
                    {asset.def.documents?.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dokumen Aset</p>
                        <DocTable docs={asset.def.documents} files={asset.files} onAdd={(docKey) => setEntityFile('assets', i, docKey)} />
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button type="button" disabled={asset.saving} className="btn-primary" onClick={() => saveEntity('assets', i)}>
                        <Save size={16} /> {asset.saving ? 'Menyimpan...' : saved ? 'Perbarui & Simpan' : 'Simpan Aset'}
                      </button>
                      {!saved && (
                        <button type="button" className="btn-secondary" onClick={() => removeEntity('assets', i)}>Buang</button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {template?.assets?.length > 0 && (
              <button type="button" className="btn-secondary" onClick={addAsset}>
                <Plus size={16} /> Tambah Aset Lain
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* Footer aksi */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {orderSaved ? (
          <button type="button" disabled={savingAll} className="btn-primary" onClick={finishCreate}>
            {savingAll ? 'Menyimpan data tersisa...' : 'Selesai — Simpan & Buka Detail Order'}
            {!savingAll && <ArrowLeft className="rotate-180" size={16} />}
          </button>
        ) : (
          <span className="text-xs text-gray-400">Simpan card Order terlebih dahulu untuk melanjutkan</span>
        )}
      </div>

      {/* Modal pilih tipe pihak */}
      {addActorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAddActorPicker(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Pilih Tipe Pihak</h3>
              <button type="button" onClick={() => setAddActorPicker(false)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {(template?.actors ?? []).map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => addActorWithDef(def)}
                  className="w-full flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-left transition-colors"
                >
                  <UserPlus size={16} className="text-primary-600 shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{def.actor_type?.label}</span>
                  {def.is_required && <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">WAJIB</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
