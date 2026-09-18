import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Save, Settings as SettingsIcon } from 'lucide-react'

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      const map = {}
      ;(res.data.settings ?? res.data).forEach?.((s) => { map[s.key] = s.value })
      setSettings(map)
    }).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/settings', { settings })
      toast.success('Pengaturan berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi informasi kantor dan sistem</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Informasi Kantor</h2>
          <div className="space-y-4">
            <div><label className="label">Nama Kantor</label><input className="input" value={settings.office_name ?? ''} onChange={(e) => set('office_name', e.target.value)} /></div>
            <div><label className="label">Alamat Kantor</label><textarea className="input h-20 resize-none" value={settings.office_address ?? ''} onChange={(e) => set('office_address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Telepon</label><input className="input" value={settings.office_phone ?? ''} onChange={(e) => set('office_phone', e.target.value)} /></div>
              <div><label className="label">Email Kantor</label><input type="email" className="input" value={settings.office_email ?? ''} onChange={(e) => set('office_email', e.target.value)} /></div>
            </div>
            <div><label className="label">Jam Operasional</label><input className="input" value={settings.office_hours ?? ''} onChange={(e) => set('office_hours', e.target.value)} /></div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Pengaturan Order</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Default SLA (hari)</label><input type="number" className="input" value={settings.default_sla_days ?? 14} onChange={(e) => set('default_sla_days', e.target.value)} /></div>
            <div><label className="label">Maks Ukuran File (MB)</label><input type="number" className="input" value={settings.max_file_size_mb ?? 10} onChange={(e) => set('max_file_size_mb', e.target.value)} /></div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  )
}
