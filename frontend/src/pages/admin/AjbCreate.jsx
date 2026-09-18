import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'

export default function AdminAjbCreate() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({ client_id: '', source_type: 'walk_in', notes: '' })

  useEffect(() => {
    api.get('/admin/clients', { params: { per_page: 200 } })
      .then((res) => setClients(res.data.data ?? []))
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.client_id) { toast.error('Pilih klien terlebih dahulu'); return }
    setSaving(true)
    try {
      const res = await api.post('/admin/ajb', form)
      toast.success('Kasus AJB berhasil dibuat')
      navigate(`/admin/ajb/${res.data.ajb_case.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat kasus AJB')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to="/admin/ajb" className="btn-secondary"><ArrowLeft size={16} /> Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Buat Kasus AJB Baru</h1>
      </div>

      <div className="card p-6">
        <p className="text-sm text-gray-600 mb-5">
          Kasus AJB (Akta Jual Beli) akan membuat order induk secara otomatis dan menginisialisasi 8 tahapan proses sesuai alur standar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Klien / Pembeli <span className="text-red-500">*</span></label>
            <select className="input" value={form.client_id} onChange={(e) => set('client_id', e.target.value)} required>
              <option value="">Pilih klien...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.nik ?? 'NIK belum diisi'}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sumber Permintaan</label>
            <select className="input" value={form.source_type} onChange={(e) => set('source_type', e.target.value)}>
              <option value="walk_in">Walk-in (Datang Langsung)</option>
              <option value="bank">Bank</option>
              <option value="notaris">Referral Notaris</option>
            </select>
          </div>
          <div>
            <label className="label">Catatan Awal</label>
            <textarea className="input h-24 resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Catatan atau keterangan tambahan..." />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-2">Yang akan dibuat secara otomatis:</p>
            <ul className="space-y-1 text-xs">
              <li>✓ Order induk (AJB) dengan nomor unik</li>
              <li>✓ 8 tahapan proses AJB sesuai SOP</li>
              <li>✓ Kode tracking untuk klien</li>
            </ul>
            <p className="text-xs mt-2 text-blue-600">Data penjual, pembeli, sertifikat, dan pembayaran pajak diisi di halaman detail.</p>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? 'Membuat...' : 'Buat Kasus AJB'}
            </button>
            <Link to="/admin/ajb" className="btn-secondary">Batal</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
