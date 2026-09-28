import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api, { storageUrl } from '../../services/api'
import { Plus, Search, Eye, Pencil, Users, Building2, UserCheck, Home, User, X, Trash2, Upload, FileText, Check, Circle, ArrowLeft, ArrowRight, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyMember = () => ({ name: '', nik: '', phone: '', email: '', npwp: '', gender: 'male', marital_status: 'single', address: '' })

const SOURCE_OPTIONS = [
  { value: 'bank', label: 'Bank', icon: Building2, desc: 'Nasabah dari bank' },
  { value: 'notaris', label: 'Notaris', icon: UserCheck, desc: 'Nasabah dari notaris' },
  { value: 'developer', label: 'Developer', icon: Home, desc: 'Nasabah dari developer' },
  { value: 'umum', label: 'Umum', icon: User, desc: 'Nasabah umum/perorangan' },
]

const REQUIRED_DOCS = [
  { key: 'ktp_nasabah', label: 'KTP Nasabah' },
  { key: 'kk', label: 'Kartu Keluarga (KK)' },
]

const MARRIED_DOCS = [
  { key: 'ktp_pasangan', label: 'KTP Pasangan' },
  { key: 'akta_nikah', label: 'Akta Nikah' },
]

const STEP_LABELS = ['Sumber Nasabah', 'Data Nasabah', 'Upload Dokumen', 'Review']

const isImageUrl = (url) => /\.(webp|jpg|jpeg|png)$/i.test(url || '')

function SourceForm({ source, detail, setDetail }) {
  const set = (k, v) => setDetail((d) => ({ ...d, [k]: v }))

  if (source === 'bank') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="label">Nama Bank *</label><input className="input" value={detail.bank_name || ''} onChange={(e) => set('bank_name', e.target.value)} placeholder="Contoh: BCA" /></div>
        <div><label className="label">Nama Cabang *</label><input className="input" value={detail.branch_name || ''} onChange={(e) => set('branch_name', e.target.value)} placeholder="Contoh: KCP Sudirman" /></div>
        <div><label className="label">Nama Pimpinan Cabang *</label><input className="input" value={detail.leader_name || ''} onChange={(e) => set('leader_name', e.target.value)} /></div>
      </div>
    )
  }

  if (source === 'notaris') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="label">Nama Notaris *</label><input className="input" value={detail.notary_name || ''} onChange={(e) => set('notary_name', e.target.value)} /></div>
        <div><label className="label">Nama PIC *</label><input className="input" value={detail.pic_name || ''} onChange={(e) => set('pic_name', e.target.value)} /></div>
        <div><label className="label">No. WhatsApp PIC *</label><input className="input" value={detail.pic_phone || ''} onChange={(e) => set('pic_phone', e.target.value)} /></div>
      </div>
    )
  }

  if (source === 'developer') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="label">Nama Developer *</label><input className="input" value={detail.developer_name || ''} onChange={(e) => set('developer_name', e.target.value)} /></div>
        <div><label className="label">Nama Perumahan *</label><input className="input" value={detail.housing_name || ''} onChange={(e) => set('housing_name', e.target.value)} /></div>
        <div><label className="label">Nama PIC *</label><input className="input" value={detail.pic_name || ''} onChange={(e) => set('pic_name', e.target.value)} /></div>
        <div><label className="label">No. WhatsApp PIC *</label><input className="input" value={detail.pic_phone || ''} onChange={(e) => set('pic_phone', e.target.value)} /></div>
      </div>
    )
  }

  if (source === 'umum') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="label">Nama *</label><input className="input" value={detail.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className="label">No. WhatsApp *</label><input className="input" value={detail.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
      </div>
    )
  }

  return null
}

function MemberForm({ member, index, onChange, onRemove, canRemove }) {
  const set = (k, v) => onChange(index, { ...member, [k]: v })

  return (
    <div className="border border-gray-200 rounded-lg p-4 relative">
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)} className="absolute top-3 right-3 p-1.5 rounded hover:bg-red-50 text-red-500">
          <Trash2 size={16} />
        </button>
      )}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Nasabah {index + 1}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="label">Nama Lengkap *</label><input className="input" value={member.name} onChange={(e) => set('name', e.target.value)} required /></div>
        <div><label className="label">NIK</label><input className="input" value={member.nik} onChange={(e) => set('nik', e.target.value)} placeholder="16 digit NIK" /></div>
        <div><label className="label">No. Telepon</label><input className="input" value={member.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className="label">Email</label><input type="email" className="input" value={member.email} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className="label">NPWP</label><input className="input" value={member.npwp} onChange={(e) => set('npwp', e.target.value)} /></div>
        <div><label className="label">Jenis Kelamin</label>
          <select className="input" value={member.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="male">Laki-laki</option><option value="female">Perempuan</option>
          </select>
        </div>
        <div><label className="label">Status Perkawinan</label>
          <select className="input" value={member.marital_status || 'single'} onChange={(e) => set('marital_status', e.target.value)}>
            <option value="single">Belum Menikah</option>
            <option value="married">Menikah</option>
            <option value="married_foreign">Menikah dengan WNA</option>
            <option value="married_prenup">Menikah dengan Perjanjian Pisah Harta</option>
            <option value="divorced">Cerai Hidup</option>
            <option value="widowed">Cerai Mati</option>
          </select>
        </div>
        <div className="md:col-span-2"><label className="label">Alamat</label><textarea className="input h-20 resize-none" value={member.address} onChange={(e) => set('address', e.target.value)} /></div>
      </div>
    </div>
  )
}

function DocUploadRow({ docKey, label, required, doc, onUpload, onDelete, uploading }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (file && file.type?.startsWith('image/')) {
      const u = URL.createObjectURL(file)
      setPreview(u)
      return () => URL.revokeObjectURL(u)
    }
    setPreview('')
  }, [file])

  const handleChoose = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    onUpload(f, docKey)
    e.target.value = ''
  }

  const hasExisting = doc && doc.url

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {hasExisting ? <Check size={14} className="text-green-500 shrink-0" /> : <Circle size={14} className="text-gray-300 shrink-0" />}
          <span className="text-sm text-gray-700">{label}</span>
          {required && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">Wajib</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasExisting && (
          <>
            {isImageUrl(doc.url) ? (
              <a href={storageUrl(doc.url)} target="_blank" rel="noreferrer" className="block">
                <img src={storageUrl(doc.url)} alt={label} className="h-10 w-14 object-cover rounded border border-gray-200" />
              </a>
            ) : (
              <a href={storageUrl(doc.url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                <FileText size={14} /> {doc.original_name?.length > 15 ? doc.original_name.slice(0, 15) + '...' : doc.original_name}
              </a>
            )}
            <button type="button" onClick={() => onDelete(doc.id)} className="p-1 rounded hover:bg-red-50 text-red-500" disabled={uploading}>
              <Trash2 size={14} />
            </button>
          </>
        )}
        <label className={`btn-secondary text-xs py-1 px-3 cursor-pointer whitespace-nowrap ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? '...' : hasExisting ? 'Ganti' : 'Upload'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleChoose} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </div>
    </div>
  )
}

function OtherDocRow({ doc, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Check size={14} className="text-green-500 shrink-0" />
          <span className="text-sm text-gray-700">{doc.label || 'Dokumen Lainnya'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isImageUrl(doc.url) ? (
          <a href={storageUrl(doc.url)} target="_blank" rel="noreferrer" className="block">
            <img src={storageUrl(doc.url)} alt={doc.label} className="h-10 w-14 object-cover rounded border border-gray-200" />
          </a>
        ) : (
          <a href={storageUrl(doc.url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
            <FileText size={14} /> {doc.original_name?.length > 15 ? doc.original_name.slice(0, 15) + '...' : doc.original_name}
          </a>
        )}
        <button type="button" onClick={() => onDelete(doc.id)} className="p-1 rounded hover:bg-red-50 text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {isDone ? <Check size={14} /> : step}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary-700' : isDone ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [step, setStep] = useState(1)
  const [clientId, setClientId] = useState(null)
  const [client, setClient] = useState(null)
  const [source, setSource] = useState('')
  const [sourceDetail, setSourceDetail] = useState({})
  const [members, setMembers] = useState([emptyMember()])
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState('')
  const [activeMemberTab, setActiveMemberTab] = useState(0)
  const [otherDocLabel, setOtherDocLabel] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/clients', { params: { search, page } })
      setClients(res.data.data)
      setMeta(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [search, page])

  const loadClient = async (id) => {
    try {
      const res = await api.get(`/admin/clients/${id}`)
      setClient(res.data.client)
      if (res.data.client.source) {
        setSource(res.data.client.source)
        setSourceDetail(res.data.client.source_detail || {})
      }
      if (res.data.client.members?.length > 0) {
        setMembers(res.data.client.members)
      }
    } catch {}
  }

  const resetWizard = () => {
    setStep(1)
    setClientId(null)
    setClient(null)
    setSource('')
    setSourceDetail({})
    setMembers([emptyMember()])
    setActiveMemberTab(0)
    setOtherDocLabel('')
  }

  const closeWizard = () => {
    setShowWizard(false)
    resetWizard()
  }

  const handleStep1 = async () => {
    if (!source) { toast.error('Pilih sumber nasabah'); return }
    setSaving(true)
    try {
      if (clientId) {
        await api.put(`/admin/clients/${clientId}`, { source, source_detail: sourceDetail })
        toast.success('Sumber nasabah berhasil diperbarui')
        await loadClient(clientId)
      } else {
        const res = await api.post('/admin/clients', { source, source_detail: sourceDetail })
        setClientId(res.data.client.id)
        setClient(res.data.client)
        toast.success('Sumber nasabah berhasil disimpan')
      }
      setStep(2)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        toast.error(Object.values(errors).flat()[0])
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan')
      }
    }
    setSaving(false)
  }

  const handleStep2 = async () => {
    if (members.some((m) => !m.name)) { toast.error('Nama nasabah wajib diisi'); return }
    setSaving(true)
    try {
      const res = await api.put(`/admin/clients/${clientId}/members`, { members })
      setClient(res.data.client)
      toast.success('Data nasabah berhasil disimpan')
      setStep(3)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        toast.error(Object.values(errors).flat()[0])
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan')
      }
    }
    setSaving(false)
  }

  const handleUploadDoc = async (file, docType, memberId = null, label = null) => {
    const key = `${memberId || 'all'}-${docType}`
    setUploadingKey(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('doc_type', docType)
      if (memberId) formData.append('client_member_id', memberId)
      if (label) formData.append('label', label)
      await api.post(`/admin/clients/${clientId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Dokumen berhasil diupload')
      await loadClient(clientId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupload dokumen')
    }
    setUploadingKey('')
  }

  const handleDeleteDoc = async (docId) => {
    try {
      await api.delete(`/admin/clients/${clientId}/documents/${docId}`)
      toast.success('Dokumen berhasil dihapus')
      await loadClient(clientId)
    } catch {
      toast.error('Gagal menghapus dokumen')
    }
  }

  const handleStep4 = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/clients/${clientId}`, { status: 'confirmed' })
      toast.success('Nasabah berhasil dikonfirmasi')
      closeWizard()
      load()
    } catch {
      toast.error('Gagal mengkonfirmasi nasabah')
    }
    setSaving(false)
  }

  const handleMemberChange = (index, updated) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? updated : m)))
  }

  const handleMemberRemove = (index) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
    if (activeMemberTab >= prev.length - 1) setActiveMemberTab(Math.max(0, prev.length - 2))
  }

  const addMember = () => {
    setMembers((prev) => [...prev, emptyMember()])
    setActiveMemberTab(members.length)
  }

  const getDocsForMember = (memberId) => {
    return client?.client_documents?.filter((d) => d.client_member_id === memberId) || []
  }

  const getDocByKey = (memberId, docKey) => {
    return getDocsForMember(memberId).find((d) => d.doc_type === docKey)
  }

  const getOtherDocs = (memberId) => {
    return getDocsForMember(memberId).filter((d) => d.doc_type === 'lainnya')
  }

  const getPrimaryName = (c) => c.members?.[0]?.name || c.name || '—'
  const getPrimaryNik = (c) => c.members?.[0]?.nik || c.nik

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className="label mb-2 block">Sumber Nasabah *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SOURCE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isSelected = source === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setSource(opt.value); setSourceDetail({}) }}
                className={`p-4 rounded-lg border-2 text-left transition ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Icon size={20} className={isSelected ? 'text-primary-600' : 'text-gray-400'} />
                <p className={`font-medium mt-2 ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
      {source && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Detail Sumber</h3>
          <SourceForm source={source} detail={sourceDetail} setDetail={setSourceDetail} />
        </div>
      )}
      <div className="border-t border-gray-200 pt-4 flex gap-3">
        <button onClick={handleStep1} disabled={saving || !source} className="btn-primary flex items-center gap-2">
          {saving ? 'Menyimpan...' : 'Simpan & Lanjut'} <ArrowRight size={16} />
        </button>
        <button onClick={closeWizard} className="btn-secondary">Batal</button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Data Nasabah</h3>
        <button type="button" onClick={addMember} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
          <Plus size={14} /> Tambah Nasabah
        </button>
      </div>
      {members.map((member, index) => (
        <MemberForm
          key={member.id || index}
          member={member}
          index={index}
          onChange={handleMemberChange}
          onRemove={handleMemberRemove}
          canRemove={members.length > 1}
        />
      ))}
      <div className="border-t border-gray-200 pt-4 flex gap-3">
        <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2"><ArrowLeft size={16} /> Kembali</button>
        <button onClick={handleStep2} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? 'Menyimpan...' : 'Simpan & Lanjut'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => {
    if (!client?.members?.length) return <p className="text-gray-500 text-sm">Belum ada data nasabah. Silakan isi di langkah sebelumnya.</p>

    const activeMember = client.members[activeMemberTab]
    if (!activeMember) return null

    const memberDocs = getDocsForMember(activeMember.id)
    const isMarried = activeMember.marital_status === 'married'
    const docsToShow = [...REQUIRED_DOCS, ...(isMarried ? MARRIED_DOCS : [])]
    const otherDocs = getOtherDocs(activeMember.id)

    return (
      <div className="space-y-5">
        {client.members.length > 1 && (
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {client.members.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMemberTab(i)}
                className={`px-3 py-1.5 rounded-t text-sm font-medium transition ${i === activeMemberTab ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m.name || `Nasabah ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dokumen Wajib</h3>
          <div className="space-y-1">
            {docsToShow.map((doc) => (
              <DocUploadRow
                key={doc.key}
                docKey={doc.key}
                label={doc.label}
                required
                doc={getDocByKey(activeMember.id, doc.key)}
                onUpload={(file) => handleUploadDoc(file, doc.key, activeMember.id)}
                onDelete={handleDeleteDoc}
                uploading={uploadingKey === `${activeMember.id}-${doc.key}`}
              />
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dokumen Tambahan</h3>
          {otherDocs.length > 0 && (
            <div className="space-y-1 mb-3">
              {otherDocs.map((doc) => (
                <OtherDocRow key={doc.id} doc={doc} onDelete={handleDeleteDoc} />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nama dokumen (misal: Akta Cerai)"
              value={otherDocLabel}
              onChange={(e) => setOtherDocLabel(e.target.value)}
            />
            <label className={`btn-secondary cursor-pointer whitespace-nowrap ${uploadingKey ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={14} className="inline mr-1" /> Upload
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f && otherDocLabel.trim()) {
                    handleUploadDoc(f, 'lainnya', activeMember.id, otherDocLabel.trim())
                    setOtherDocLabel('')
                  } else if (!otherDocLabel.trim()) {
                    toast.error('Isi nama dokumen terlebih dahulu')
                  }
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex gap-3">
          <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2"><ArrowLeft size={16} /> Kembali</button>
          <button onClick={() => setStep(4)} className="btn-primary flex items-center gap-2">
            Lanjut Review <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  const renderStep4 = () => {
    if (!client) return null

    return (
      <div className="space-y-5">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Building2 size={16} /> Sumber Nasabah
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Jenis:</span> <span className="font-medium capitalize">{client.source}</span></div>
            {client.source_detail && Object.entries(client.source_detail).map(([k, v]) => (
              <div key={k}><span className="text-gray-500">{k.replace(/_/g, ' ')}:</span> <span className="font-medium">{v}</span></div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users size={16} /> Data Nasabah ({client.members?.length || 0})
          </h3>
          <div className="space-y-3">
            {client.members?.map((m, i) => (
              <div key={m.id} className="border border-gray-100 rounded p-3">
                <p className="font-medium text-sm text-gray-900">{i + 1}. {m.name}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mt-1">
                  {m.nik && <p>NIK: {m.nik}</p>}
                  {m.phone && <p>Telp: {m.phone}</p>}
                  {m.email && <p>Email: {m.email}</p>}
                  {m.npwp && <p>NPWP: {m.npwp}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText size={16} /> Dokumen Terupload
          </h3>
          {client.members?.map((m) => {
            const docs = getDocsForMember(m.id)
            if (docs.length === 0) return null
            return (
              <div key={m.id} className="mb-3 last:mb-0">
                <p className="text-xs font-medium text-gray-600 mb-1">{m.name}</p>
                <div className="flex flex-wrap gap-2">
                  {docs.map((d) => (
                    <span key={d.id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs">
                      <Check size={12} /> {d.doc_type === 'lainnya' ? d.label : d.doc_type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
          {(!client.client_documents || client.client_documents.length === 0) && (
            <p className="text-sm text-gray-400">Belum ada dokumen yang diupload</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 flex gap-3">
          <button onClick={() => setStep(3)} className="btn-secondary flex items-center gap-2"><ArrowLeft size={16} /> Kembali</button>
          <button onClick={handleStep4} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Konfirmasi & Simpan'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sumber & Nasabah</h1>
          <p className="text-gray-500 text-sm mt-1">Database sumber data & nasabah kantor notaris</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary">
          <Plus size={18} /> Tambah Nasabah
        </button>
      </div>

      {showWizard && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Tambah Nasabah Baru</h2>
            <button onClick={closeWizard} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
          <StepIndicator currentStep={step} />
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      )}

      <div className="card p-4">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Cari nama, NIK, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400"><Users size={40} className="mb-2 opacity-30" /><p>Tidak ada nasabah ditemukan</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-left px-4 py-3">NIK</th>
                <th className="text-left px-4 py-3">Sumber</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Anggota</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{getPrimaryName(c)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{getPrimaryNik(c) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {c.source ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.status === 'confirmed' ? 'Confirmed' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.members?.length ?? 0} orang</td>
                  <td className="px-4 py-3 text-gray-600">{c.documents_count ?? 0} order</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/clients/${c.id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 inline-flex" title="Lihat detail"><Eye size={15} /></Link>
                      <Link to={`/admin/clients/${c.id}`} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 inline-flex" title="Edit / lanjutkan pengisian"><Pencil size={15} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Total {meta.total} nasabah</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">←</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= meta.last_page} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
