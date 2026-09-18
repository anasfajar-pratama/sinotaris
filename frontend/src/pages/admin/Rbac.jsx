import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ShieldCheck, Plus, Trash2, Save, CheckSquare, Square } from 'lucide-react'

const ACTION_LABELS = {
  view: 'Lihat', create: 'Tambah', edit: 'Ubah', delete: 'Hapus',
  approve: 'Approve', export: 'Export', manage: 'Kelola',
}

export default function AdminRbac() {
  const [roles, setRoles] = useState([])
  const [modules, setModules] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [checked, setChecked] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [rolesRes, permRes] = await Promise.all([
        api.get('/admin/rbac/roles'),
        api.get('/admin/rbac/permissions'),
      ])
      setRoles(rolesRes.data.data ?? [])
      setModules(permRes.data.data ?? {})
      const first = (rolesRes.data.data ?? [])[0]
      setSelectedId(first?.id ?? null)
      setChecked(Object.fromEntries(first?.permissions?.map((p) => [p, true]) ?? []))
    } catch {}
    setLoading(false)
  }

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedId) ?? null, [roles, selectedId])

  const selectRole = (role) => {
    setSelectedId(role.id)
    setChecked(Object.fromEntries((role.permissions ?? []).map((p) => [p, true])))
  }

  const allPermissionNames = useMemo(
    () => Object.values(modules).flat().map((p) => p.name),
    [modules],
  )

  const toggle = (name) => setChecked((c) => ({ ...c, [name]: !c[name] }))

  const allChecked = allPermissionNames.every((p) => checked[p])

  const toggleModule = (perms) => {
    const on = perms.some((p) => !checked[p.name])
    setChecked((c) => {
      const next = { ...c }
      perms.forEach((p) => { next[p.name] = on })
      return next
    })
  }

  const toggleAll = () => {
    const on = !allChecked
    setChecked((c) => {
      const next = { ...c }
      allPermissionNames.forEach((p) => { next[p] = on })
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const permissions = allPermissionNames.filter((p) => checked[p])
    try {
      const res = await api.put(`/admin/rbac/roles/${selectedId}/permissions`, { permissions })
      setRoles((rs) => rs.map((r) => r.id === selectedId
        ? { ...r, permissions: (res.data.permissions ?? permissions) }
        : r))
      toast.success('Permission role berhasil disimpan')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan permission')
    }
    setSaving(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newRoleName.trim()) return
    try {
      await api.post('/admin/rbac/roles', { name: newRoleName.trim().toLowerCase(), permissions: [] })
      toast.success('Role berhasil ditambahkan')
      setNewRoleName('')
      setShowCreate(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan role')
    }
  }

  const handleDelete = async (role) => {
    if (!confirm(`Hapus role "${role.name}"?`)) return
    try {
      await api.delete(`/admin/rbac/roles/${role.id}`)
      toast.success('Role dihapus')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus role')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen RBAC</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola role dan permission akses pengguna</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary"><Plus size={18} /> Tambah Role</button>
      </div>

      {showCreate && (
        <div className="card p-5 max-w-md">
          <h2 className="text-base font-semibold mb-4">Form Tambah Role</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Nama Role *</label>
              <input
                className="input"
                placeholder="contoh: ppat / kurir"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan Role'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role list */}
        <div className="card overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary-700" />
            <span className="font-semibold text-sm">Daftar Role</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  onClick={() => selectRole(role)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedId === role.id ? 'bg-primary-50' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${selectedId === role.id ? 'text-primary-700' : 'text-gray-800'}`}>
                      {role.name}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">{role.permissions?.length ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Permission editor */}
        <div className="card p-5 lg:col-span-3">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">{selectedRole.name}</h2>
                  <span className="badge badge-blue">{selectedRole.name === 'super-admin' ? 'Semua akses' : `${Object.keys(checked).filter((k) => checked[k]).length} izin`}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRole.name !== 'super-admin' && (
                    <button onClick={() => toggleAll()} className="btn-secondary text-sm">
                      {allChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                      {allChecked ? 'Hapus Semua' : 'Pilih Semua'}
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                    {saving ? 'Menyimpan...' : 'Simpan Permission'}
                  </button>
                  {selectedRole.name !== 'super-admin' && (
                    <button onClick={() => handleDelete(selectedRole)} className="btn-secondary text-sm text-red-600 hover:bg-red-50">
                      <Trash2 size={14} /> Hapus
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-500 text-xs mb-5">
                {selectedRole.name === 'super-admin'
                  ? 'Role super-admin selalu memegang seluruh permission dan tidak dapat diubah.'
                  : 'Centang permission untuk memberikan akses pada role ini.'}
              </p>

              <div className="space-y-4">
                {Object.entries(modules).map(([module, perms]) => {
                  const selectedCount = perms.filter((p) => checked[p.name]).length
                  return (
                    <div key={module} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => selectedRole.name !== 'super-admin' && toggleModule(perms)}
                        disabled={selectedRole.name === 'super-admin'}
                        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors ${selectedRole.name === 'super-admin' ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <span className="flex items-center gap-2 font-semibold capitalize text-sm text-gray-800">
                          {module === 'rbac' ? 'Hak Akses (RBAC)' : module}
                          <span className="badge badge-gray text-xs">{selectedCount}/{perms.length}</span>
                        </span>
                        <span className="text-xs text-gray-400">{selectedRole.name === 'super-admin' ? 'Semua' : 'Pilih modul'}</span>
                      </button>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-white">
                        {perms.map((p) => (
                          <label
                            key={p.name}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${checked[p.name]
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-primary-600"
                              checked={!!checked[p.name]}
                              disabled={selectedRole.name === 'super-admin'}
                              onChange={() => toggle(p.name)}
                            />
                            <span className="text-sm text-gray-800 capitalize">{ACTION_LABELS[p.name.split('.')[1]] ?? p.name.split('.')[1]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">Pilih role untuk melihat permission</div>
          )}
        </div>
      </div>
    </div>
  )
}