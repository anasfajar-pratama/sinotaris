import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Plus, Edit, Trash2, Users as UsersIcon, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_STYLES = { 'super-admin': 'badge-red', notaris: 'badge-purple', staff: 'badge-blue', klien: 'badge-green', kurir: 'badge-gray' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.data ?? res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/users', form)
      toast.success('User berhasil ditambahkan')
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'staff', phone: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan user')
    }
    setSaving(false)
  }

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/users/${id}/toggle-status`)
      setUsers((u) => u.map((usr) => usr.id === id ? { ...usr, is_active: !currentStatus } : usr))
      toast.success('Status user diperbarui')
    } catch {}
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus user "${name}"?`)) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User dihapus')
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola akses dan peran pengguna</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={18} /> Tambah User</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="text-base font-semibold mb-4">Form Tambah User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Nama Lengkap *</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
            <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} required /></div>
            <div><label className="label">Password *</label><input type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} /></div>
            <div><label className="label">Telepon</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="staff">Staff</option>
                <option value="notaris">Notaris</option>
                <option value="klien">Klien</option>
                <option value="kurir">Kurir</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan User'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Login Terakhir</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map?.((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">{u.name?.charAt(0)}</div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={ROLE_STYLES[u.role] ?? 'badge-gray'}>{u.role}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(u.id, u.is_active)} className={`flex items-center gap-1 text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'Belum pernah'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
