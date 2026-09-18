import { useState } from 'react'
import api from '../../services/api'
import useAuthStore from '../../stores/authStore'
import toast from 'react-hot-toast'
import { Save, Lock } from 'lucide-react'

export default function ClientProfile() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '' })
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setPw = (k, v) => setPwForm((f) => ({ ...f, [k]: v }))

  const handleProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', form)
      updateUser(res.data.user)
      toast.success('Profil berhasil diperbarui')
    } catch {
      toast.error('Gagal memperbarui profil')
    }
    setSaving(false)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (pwForm.password !== pwForm.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setSavingPw(true)
    try {
      await api.put('/auth/change-password', pwForm)
      toast.success('Password berhasil diubah')
      setPwForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password')
    }
    setSavingPw(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Informasi Pribadi</h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div><label className="label">Nama Lengkap</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className="label">Nomor Telepon</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} /> Ubah Password</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div><label className="label">Password Saat Ini</label><input type="password" className="input" value={pwForm.current_password} onChange={(e) => setPw('current_password', e.target.value)} required /></div>
          <div><label className="label">Password Baru</label><input type="password" className="input" value={pwForm.password} onChange={(e) => setPw('password', e.target.value)} required minLength={8} /></div>
          <div><label className="label">Konfirmasi Password Baru</label><input type="password" className="input" value={pwForm.password_confirmation} onChange={(e) => setPw('password_confirmation', e.target.value)} required /></div>
          <button type="submit" disabled={savingPw} className="btn-primary"><Lock size={16} /> {savingPw ? 'Menyimpan...' : 'Ubah Password'}</button>
        </form>
      </div>
    </div>
  )
}
