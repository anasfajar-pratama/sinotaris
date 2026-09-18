import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Search, Eye, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ nik: '', name: '', phone: '', email: '', address: '', npwp: '', gender: 'male' })
  const [saving, setSaving] = useState(false)

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

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/clients', form)
      toast.success('Klien berhasil ditambahkan')
      setShowCreate(false)
      setForm({ nik: '', name: '', phone: '', email: '', address: '', npwp: '', gender: 'male' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan klien')
    }
    setSaving(false)
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Klien</h1>
          <p className="text-gray-500 text-sm mt-1">Database klien kantor notaris</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus size={18} /> Tambah Klien
        </button>
      </div>

      {showCreate && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Form Tambah Klien</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">NIK</label><input className="input" value={form.nik} onChange={(e) => set('nik', e.target.value)} placeholder="16 digit NIK" /></div>
            <div><label className="label">Nama Lengkap *</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
            <div><label className="label">No. Telepon</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><label className="label">NPWP</label><input className="input" value={form.npwp} onChange={(e) => set('npwp', e.target.value)} /></div>
            <div><label className="label">Jenis Kelamin</label>
              <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="male">Laki-laki</option><option value="female">Perempuan</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="label">Alamat</label><textarea className="input h-20 resize-none" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-4">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Cari nama, NIK, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400"><Users size={40} className="mb-2 opacity-30" /><p>Tidak ada klien ditemukan</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-left px-4 py-3">NIK</th>
                <th className="text-left px-4 py-3">Telepon</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.nik ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.documents_count ?? 0} order</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/clients/${c.id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 inline-flex"><Eye size={15} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Total {meta.total} klien</p>
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
