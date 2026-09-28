import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { storageUrl } from '../../services/api'
import { ArrowLeft, FileText, User, Users, Building2, UserCheck, Home, Check, Trash2, Upload, Circle, Pencil, Plus, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STYLES = { draft: 'badge-gray', in_progress: 'badge-blue', review: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }
const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }

const SOURCE_LABELS = { bank: 'Bank', notaris: 'Notaris', developer: 'Developer', umum: 'Umum' }
const SOURCE_ICONS = { bank: Building2, notaris: UserCheck, developer: Home, umum: User }
const SOURCE_OPTIONS = [
  { value: 'bank', label: 'Bank', icon: Building2 },
  { value: 'notaris', label: 'Notaris', icon: UserCheck },
  { value: 'developer', label: 'Developer', icon: Home },
  { value: 'umum', label: 'Umum', icon: User },
]

const DOC_TYPE_LABELS = {
  ktp_nasabah: 'KTP Nasabah',
  ktp_pasangan: 'KTP Pasangan',
  kk: 'Kartu Keluarga',
  akta_nikah: 'Akta Nikah',
  lainnya: 'Dokumen Lainnya',
}

const REQUIRED_DOCS = [
  { key: 'ktp_nasabah', label: 'KTP Nasabah' },
  { key: 'kk', label: 'Kartu Keluarga (KK)' },
]

const MARRIED_DOCS = [
  { key: 'ktp_pasangan', label: 'KTP Pasangan' },
  { key: 'akta_nikah', label: 'Akta Nikah' },
]

const MARRIED_KINDS = ['married', 'married_foreign', 'married_prenup']

const MARITAL_LABELS = {
  single: 'Belum Menikah',
  married: 'Menikah',
  married_foreign: 'Menikah dengan WNA',
  married_prenup: 'Menikah dengan Perjanjian Pisah Harta',
  divorced: 'Cerai Hidup',
  widowed: 'Cerai Mati',
}

const emptyMember = () => ({ name: '', nik: '', phone: '', email: '', npwp: '', gender: 'male', marital_status: 'single', address: '' })

const isImageUrl = (url) => /\.(webp|jpg|jpeg|png)$/i.test(url || '')

function SourceDetail({ source, detail }) {
  if (!source || !detail) return <p className="text-gray-400 text-sm">—</p>

  if (source === 'bank') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{detail.bank_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Cabang</span><span className="font-medium">{detail.branch_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Pimpinan Cabang</span><span className="font-medium">{detail.leader_name}</span></div>
      </div>
    )
  }

  if (source === 'notaris') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Notaris</span><span className="font-medium">{detail.notary_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">PIC</span><span className="font-medium">{detail.pic_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">No. WA PIC</span><span className="font-medium">{detail.pic_phone}</span></div>
      </div>
    )
  }

  if (source === 'developer') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Developer</span><span className="font-medium">{detail.developer_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Perumahan</span><span className="font-medium">{detail.housing_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">PIC</span><span className="font-medium">{detail.pic_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">No. WA PIC</span><span className="font-medium">{detail.pic_phone}</span></div>
      </div>
    )
  }

  if (source === 'umum') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Nama</span><span className="font-medium">{detail.name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">No. WA</span><span className="font-medium">{detail.phone}</span></div>
      </div>
    )
  }

  return null
}

function SourceEditForm({ source, detail, setSource, setDetail }) {
  const set = (k, v) => setDetail((d) => ({ ...d, [k]: v }))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {SOURCE_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isSelected = source === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setSource(opt.value); setDetail({}) }}
              className={`p-3 rounded-lg border-2 text-left transition ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <Icon size={16} className={isSelected ? 'text-primary-600' : 'text-gray-400'} />
              <p className={`text-sm font-medium mt-1 ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>{opt.label}</p>
            </button>
          )
        })}
      </div>

      {source === 'bank' && (
        <div className="space-y-3">
          <div><label className="label">Nama Bank *</label><input className="input" value={detail.bank_name || ''} onChange={(e) => set('bank_name', e.target.value)} placeholder="Contoh: BCA" /></div>
          <div><label className="label">Nama Cabang *</label><input className="input" value={detail.branch_name || ''} onChange={(e) => set('branch_name', e.target.value)} /></div>
          <div><label className="label">Nama Pimpinan Cabang *</label><input className="input" value={detail.leader_name || ''} onChange={(e) => set('leader_name', e.target.value)} /></div>
        </div>
      )}
      {source === 'notaris' && (
        <div className="space-y-3">
          <div><label className="label">Nama Notaris *</label><input className="input" value={detail.notary_name || ''} onChange={(e) => set('notary_name', e.target.value)} /></div>
          <div><label className="label">Nama PIC *</label><input className="input" value={detail.pic_name || ''} onChange={(e) => set('pic_name', e.target.value)} /></div>
          <div><label className="label">No. WhatsApp PIC *</label><input className="input" value={detail.pic_phone || ''} onChange={(e) => set('pic_phone', e.target.value)} /></div>
        </div>
      )}
      {source === 'developer' && (
        <div className="space-y-3">
          <div><label className="label">Nama Developer *</label><input className="input" value={detail.developer_name || ''} onChange={(e) => set('developer_name', e.target.value)} /></div>
          <div><label className="label">Nama Perumahan *</label><input className="input" value={detail.housing_name || ''} onChange={(e) => set('housing_name', e.target.value)} /></div>
          <div><label className="label">Nama PIC *</label><input className="input" value={detail.pic_name || ''} onChange={(e) => set('pic_name', e.target.value)} /></div>
          <div><label className="label">No. WhatsApp PIC *</label><input className="input" value={detail.pic_phone || ''} onChange={(e) => set('pic_phone', e.target.value)} /></div>
        </div>
      )}
      {source === 'umum' && (
        <div className="space-y-3">
          <div><label className="label">Nama *</label><input className="input" value={detail.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className="label">No. WhatsApp *</label><input className="input" value={detail.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
        </div>
      )}
    </div>
  )
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
        <div><label className="label">NIK</label><input className="input" value={member.nik ?? ''} onChange={(e) => set('nik', e.target.value)} placeholder="16 digit NIK" /></div>
        <div><label className="label">No. Telepon</label><input className="input" value={member.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className="label">Email</label><input type="email" className="input" value={member.email ?? ''} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className="label">NPWP</label><input className="input" value={member.npwp ?? ''} onChange={(e) => set('npwp', e.target.value)} /></div>
        <div><label className="label">Jenis Kelamin</label>
          <select className="input" value={member.gender ?? 'male'} onChange={(e) => set('gender', e.target.value)}>
            <option value="male">Laki-laki</option><option value="female">Perempuan</option>
          </select>
        </div>
        <div><label className="label">Status Perkawinan</label>
          <select className="input" value={member.marital_status || 'single'} onChange={(e) => set('marital_status', e.target.value)}>
            {Object.entries(MARITAL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className="label">Alamat</label><textarea className="input h-20 resize-none" value={member.address ?? ''} onChange={(e) => set('address', e.target.value)} /></div>
      </div>
    </div>
  )
}

function DocUploadRow({ label, required, doc, onUpload, onDelete, uploading }) {
  const handleChoose = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    onUpload(f)
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
          <input type="file" className="hidden" onChange={handleChoose} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
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

function MemberCard({ member, index, documents, onDeleteDoc, onUploadDoc, uploadingKey, otherLabel, setOtherLabel }) {
  const memberDocs = documents?.filter((d) => d.client_member_id === member.id) || []
  const getDocByKey = (key) => memberDocs.find((d) => d.doc_type === key)
  const otherDocs = memberDocs.filter((d) => d.doc_type === 'lainnya')
  const docsToShow = [...REQUIRED_DOCS, ...(MARRIED_KINDS.includes(member.marital_status) ? MARRIED_DOCS : [])]

  const handleOtherUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!otherLabel?.trim()) {
      toast.error('Isi nama dokumen terlebih dahulu')
      e.target.value = ''
      return
    }
    onUploadDoc(f, 'lainnya', member.id, otherLabel.trim())
    setOtherLabel('')
    e.target.value = ''
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700">
          {member.name?.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{member.name}</h3>
          <p className="text-xs text-gray-500">Nasabah {index + 1}{member.marital_status ? ` · ${MARITAL_LABELS[member.marital_status] ?? member.marital_status}` : ''}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">NIK</span><span className="font-medium font-mono">{member.nik ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Telepon</span><span className="font-medium">{member.phone ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{member.email ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">NPWP</span><span className="font-medium font-mono text-xs">{member.npwp ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Kelamin</span><span className="font-medium">{member.gender === 'female' ? 'Perempuan' : 'Laki-laki'}</span></div>
        {member.birth_date && <div className="flex justify-between"><span className="text-gray-500">Tgl Lahir</span><span className="font-medium">{new Date(member.birth_date).toLocaleDateString('id-ID')}</span></div>}
      </div>
      {member.address && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-gray-500 text-xs mb-1">Alamat</p>
          <p className="text-sm">{member.address}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-gray-500 text-xs mb-1">Dokumen Wajib</p>
        <div className="space-y-1">
          {docsToShow.map((doc) => (
            <DocUploadRow
              key={doc.key}
              label={doc.label}
              required
              doc={getDocByKey(doc.key)}
              onUpload={(file) => onUploadDoc(file, doc.key, member.id)}
              onDelete={onDeleteDoc}
              uploading={uploadingKey === `${member.id}-${doc.key}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-gray-500 text-xs mb-1">Dokumen Tambahan</p>
        {otherDocs.length > 0 && (
          <div className="space-y-1 mb-2">
            {otherDocs.map((doc) => <OtherDocRow key={doc.id} doc={doc} onDelete={onDeleteDoc} />)}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm py-1.5"
            placeholder="Nama dokumen (misal: Akta Cerai)"
            value={otherLabel || ''}
            onChange={(e) => setOtherLabel(e.target.value)}
          />
          <label className={`btn-secondary text-xs py-1.5 px-3 cursor-pointer whitespace-nowrap ${uploadingKey === `${member.id}-lainnya` ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={12} className="inline mr-1" /> Upload
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleOtherUpload} />
          </label>
        </div>
      </div>
    </div>
  )
}

export default function AdminClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState('')
  const [otherLabels, setOtherLabels] = useState({})

  const [editingSource, setEditingSource] = useState(false)
  const [sourceDraft, setSourceDraft] = useState('')
  const [sourceDetailDraft, setSourceDetailDraft] = useState({})

  const [editingMembers, setEditingMembers] = useState(false)
  const [membersDraft, setMembersDraft] = useState([])

  const load = async () => {
    try {
      const [clientRes, ordersRes] = await Promise.all([
        api.get(`/admin/clients/${id}`),
        api.get(`/admin/clients/${id}/orders`),
      ])
      setClient(clientRes.data.client)
      setOrders(ordersRes.data.data ?? ordersRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const showError = (err, fallback) => {
    const errors = err.response?.data?.errors
    if (errors) {
      toast.error(Object.values(errors).flat()[0])
    } else {
      toast.error(err.response?.data?.message || fallback)
    }
  }

  const handleUploadDoc = async (file, docType, memberId = null, label = null) => {
    setUploadingKey(`${memberId || 'all'}-${docType}`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('doc_type', docType)
      if (memberId) formData.append('client_member_id', memberId)
      if (label) formData.append('label', label)
      await api.post(`/admin/clients/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Dokumen berhasil diupload')
      await load()
    } catch (err) {
      showError(err, 'Gagal mengupload dokumen')
    }
    setUploadingKey('')
  }

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Hapus dokumen ini?')) return
    try {
      await api.delete(`/admin/clients/${id}/documents/${docId}`)
      toast.success('Dokumen berhasil dihapus')
      await load()
    } catch {
      toast.error('Gagal menghapus dokumen')
    }
  }

  const startEditSource = () => {
    setSourceDraft(client.source || '')
    setSourceDetailDraft({ ...(client.source_detail || {}) })
    setEditingSource(true)
  }

  const saveSource = async () => {
    if (!sourceDraft) { toast.error('Pilih sumber nasabah'); return }
    setSaving(true)
    try {
      const res = await api.put(`/admin/clients/${id}`, { source: sourceDraft, source_detail: sourceDetailDraft })
      setClient(res.data.client)
      setEditingSource(false)
      toast.success('Sumber nasabah berhasil diperbarui')
    } catch (err) {
      showError(err, 'Gagal menyimpan sumber nasabah')
    }
    setSaving(false)
  }

  const startEditMembers = () => {
    setMembersDraft(client.members?.length ? client.members.map((m) => ({ ...m })) : [emptyMember()])
    setEditingMembers(true)
  }

  const handleMemberChange = (index, updated) => {
    setMembersDraft((prev) => prev.map((m, i) => (i === index ? updated : m)))
  }

  const handleMemberRemove = (index) => {
    const member = membersDraft[index]
    if (member?.id && !confirm('Hapus nasabah ini? Semua dokumen yang sudah diupload untuk nasabah ini juga akan dihapus saat disimpan.')) return
    setMembersDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const saveMembers = async () => {
    if (membersDraft.length === 0) { toast.error('Minimal ada 1 nasabah'); return }
    if (membersDraft.some((m) => !m.name?.trim())) { toast.error('Nama nasabah wajib diisi'); return }
    setSaving(true)
    try {
      const res = await api.put(`/admin/clients/${id}/members`, { members: membersDraft })
      setClient(res.data.client)
      setEditingMembers(false)
      toast.success('Data nasabah berhasil disimpan')
    } catch (err) {
      showError(err, 'Gagal menyimpan data nasabah')
    }
    setSaving(false)
  }

  const handleConfirm = async () => {
    if (!confirm('Konfirmasi data nasabah ini? Pastikan data dan dokumen sudah lengkap.')) return
    setSaving(true)
    try {
      const res = await api.put(`/admin/clients/${id}`, { status: 'confirmed' })
      setClient(res.data.client)
      toast.success('Nasabah berhasil dikonfirmasi')
    } catch {
      toast.error('Gagal mengkonfirmasi nasabah')
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
  if (!client) return <div className="text-center py-20 text-gray-500">Nasabah tidak ditemukan</div>

  const primaryMember = client.members?.[0]
  const SourceIcon = client.source ? SOURCE_ICONS[client.source] : User

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/clients" className="btn-secondary"><ArrowLeft size={16} /> Kembali</Link>
        <h1 className="text-xl font-bold text-gray-900">Profil Nasabah</h1>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${client.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {client.status === 'confirmed' ? 'Confirmed' : 'Draft'}
        </span>
        {client.status !== 'confirmed' && (
          <button onClick={handleConfirm} disabled={saving} className="btn-primary ml-auto">
            <Check size={16} /> {saving ? 'Menyimpan...' : 'Konfirmasi'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700 mb-3">
              {primaryMember?.name?.charAt(0) ?? '?'}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{primaryMember?.name ?? '—'}</h2>
            <p className="text-gray-500 text-sm">{primaryMember?.email ?? 'Email tidak tersedia'}</p>
            <p className="text-xs text-gray-400 mt-1">{client.members?.length ?? 0} anggota</p>
          </div>

          <div className="pt-4 border-t border-gray-100 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SourceIcon size={16} className="text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Sumber Nasabah</h3>
              </div>
              {!editingSource && (
                <button onClick={startEditSource} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Edit sumber">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            {editingSource ? (
              <div className="space-y-3">
                <SourceEditForm source={sourceDraft} detail={sourceDetailDraft} setSource={setSourceDraft} setDetail={setSourceDetailDraft} />
                <div className="flex gap-2">
                  <button onClick={saveSource} disabled={saving || !sourceDraft} className="btn-primary text-xs py-1.5 px-3">
                    <Save size={12} /> {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button onClick={() => setEditingSource(false)} className="btn-secondary text-xs py-1.5 px-3">
                    <X size={12} /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 capitalize">
                    {SOURCE_LABELS[client.source] ?? '—'}
                  </span>
                </div>
                <SourceDetail source={client.source} detail={client.source_detail} />
              </>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Ringkasan Dokumen</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total dokumen</span>
                <span className="font-medium">{client.client_documents?.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} /> Daftar Nasabah ({client.members?.length ?? 0})
              </h2>
              {!editingMembers && (
                <button onClick={startEditMembers} className="btn-secondary text-xs py-1.5 px-3">
                  <Pencil size={12} /> Edit Data
                </button>
              )}
            </div>

            {editingMembers ? (
              <div className="space-y-4">
                {membersDraft.map((member, index) => (
                  <MemberForm
                    key={member.id || index}
                    member={member}
                    index={index}
                    onChange={handleMemberChange}
                    onRemove={handleMemberRemove}
                    canRemove={membersDraft.length > 1}
                  />
                ))}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setMembersDraft((prev) => [...prev, emptyMember()])} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <Plus size={14} /> Tambah Nasabah
                  </button>
                  <div className="ml-auto flex gap-2">
                    <button onClick={saveMembers} disabled={saving} className="btn-primary text-sm py-1.5 px-4">
                      <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button onClick={() => setEditingMembers(false)} className="btn-secondary text-sm py-1.5 px-4">Batal</button>
                  </div>
                </div>
              </div>
            ) : client.members?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.members.map((member, index) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    index={index}
                    documents={client.client_documents}
                    onDeleteDoc={handleDeleteDoc}
                    onUploadDoc={handleUploadDoc}
                    uploadingKey={uploadingKey}
                    otherLabel={otherLabels[member.id] || ''}
                    setOtherLabel={(v) => setOtherLabels((prev) => ({ ...prev, [member.id]: v }))}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">Belum ada data nasabah</p>
                <button onClick={startEditMembers} className="btn-primary text-sm">
                  <Plus size={14} /> Isi Data Nasabah
                </button>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} /> Riwayat Order
            </h2>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada order untuk nasabah ini</p>
            ) : (
              <div className="space-y-2">
                {orders.map((doc) => (
                  <Link key={doc.id} to={`/admin/documents/${doc.id}`} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.doc_number} · {doc.document_type?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_STYLES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                      <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
