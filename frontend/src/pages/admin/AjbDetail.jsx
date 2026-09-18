import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Clock, Circle, Upload, ChevronDown, ChevronUp } from 'lucide-react'

const STEP_ICONS = { completed: <CheckCircle size={20} className="text-green-500" />, in_progress: <Clock size={20} className="text-blue-500" />, pending: <Circle size={20} className="text-gray-300" /> }

export default function AdminAjbDetail() {
  const { id } = useParams()
  const [ajb, setAjb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanding, setExpanding] = useState(null)
  const [stepNotes, setStepNotes] = useState({})
  const [taxForm, setTaxForm] = useState({ type: 'bphtb', amount: '', payment_date: '', receipt_number: '' })
  const [showTaxForm, setShowTaxForm] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/ajb/${id}`)
      setAjb(res.data.ajb_case)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleUpdateStep = async (stepNumber, status) => {
    try {
      await api.put(`/admin/documents/${ajb.document_id}/stage`, {
        stage_number: stepNumber,
        status,
        notes: stepNotes[stepNumber] || '',
      })
      toast.success('Tahapan berhasil diperbarui')
      load()
    } catch {}
  }

  const handleTaxSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/admin/ajb/${id}/tax-payment`, taxForm)
      toast.success('Pembayaran pajak berhasil dicatat')
      setShowTaxForm(false)
      load()
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
  if (!ajb) return <div className="text-center py-20 text-gray-500">Kasus AJB tidak ditemukan</div>

  const stageTotal = (ajb.document?.stages?.length) || 8
  const stageCurrent = Math.max(0, ...(ajb.document?.stages ?? []).filter((s) => s.status !== 'pending').map((s) => s.stage_number))
  const progress = stageTotal ? Math.round((stageCurrent / stageTotal) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/documents/${ajb.document_id}`} className="btn-secondary"><ArrowLeft size={16} /> Kembali ke Order</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Detail Kasus AJB</h1>
          <p className="text-gray-500 text-sm">{ajb.case_number}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`badge ${ajb.status === 'active' ? 'badge-blue' : ajb.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>
            {ajb.status === 'active' ? 'Aktif' : ajb.status === 'completed' ? 'Selesai' : ajb.status}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Progress: Tahap {stageCurrent} dari {stageTotal}</p>
          <p className="text-sm font-bold text-primary-700">{progress}%</p>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Timeline tahapan (DocumentStage) */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Timeline Proses Order ({stageTotal} Tahapan)</h2>
            <div className="space-y-3">
              {(ajb.document?.stages ?? []).map((step) => (
                <div key={step.id} className={`rounded-xl border p-4 transition-all ${step.status === 'in_progress' ? 'border-blue-300 bg-blue-50' : step.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    {STEP_ICONS[step.status]}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        Tahap {step.stage_number}: {step.stage_name}
                      </p>
                      {step.completed_at && (
                        <p className="text-xs text-gray-500">Selesai: {new Date(step.completed_at).toLocaleString('id-ID')}</p>
                      )}
                      {step.notes && <p className="text-xs text-gray-500 italic mt-1">{step.notes}</p>}
                    </div>
                    {step.status !== 'completed' && step.status !== 'pending' && (
                      <button
                        onClick={() => setExpanding(expanding === step.stage_number ? null : step.stage_number)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expanding === step.stage_number ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>

                  {expanding === step.stage_number && step.status !== 'completed' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                      <input
                        className="input text-sm flex-1"
                        placeholder="Catatan (opsional)"
                        value={stepNotes[step.stage_number] || ''}
                        onChange={(e) => setStepNotes({ ...stepNotes, [step.stage_number]: e.target.value })}
                      />
                      {step.status === 'pending' && (
                        <button onClick={() => handleUpdateStep(step.stage_number, 'in_progress')} className="btn-secondary text-sm">Mulai</button>
                      )}
                      {step.status === 'in_progress' && (
                        <button onClick={() => handleUpdateStep(step.stage_number, 'completed')} className="btn-primary text-sm">Selesai</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Parties */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Penjual</h2>
            {ajb.sellers?.length === 0 ? <p className="text-xs text-gray-400">Belum ada data penjual</p> : (
              ajb.sellers?.map((s) => (
                <div key={s.id} className="text-xs space-y-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-gray-500">NIK: {s.nik}</p>
                  <p className="text-gray-500">Status: {s.marital_status === 'married' ? 'Menikah' : 'Lajang'}</p>
                  {s.spouse_name && <p className="text-gray-500">Istri/Suami: {s.spouse_name}</p>}
                </div>
              ))
            )}
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Pembeli</h2>
            {ajb.buyers?.length === 0 ? <p className="text-xs text-gray-400">Belum ada data pembeli</p> : (
              ajb.buyers?.map((b) => (
                <div key={b.id} className="text-xs space-y-1">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-gray-500">NIK: {b.nik}</p>
                  <p className="text-gray-500">NPWP: {b.npwp ?? '—'}</p>
                </div>
              ))
            )}
          </div>

          {/* Certificate */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Sertifikat</h2>
            {ajb.certificates?.length === 0 ? <p className="text-xs text-gray-400">Belum ada data sertifikat</p> : (
              ajb.certificates?.map((c) => (
                <div key={c.id} className="text-xs space-y-1">
                  <p className="font-medium">{c.cert_type} No. {c.cert_number}</p>
                  <p className="text-gray-500">Luas: {c.land_area} m²</p>
                  <p className="text-gray-500">{c.address}</p>
                  <p className={`font-medium ${c.verified_at ? 'text-green-600' : 'text-yellow-600'}`}>
                    {c.verified_at ? '✓ Terverifikasi' : 'Belum diverifikasi'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Tax Payments */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Pembayaran Pajak</h2>
              <button onClick={() => setShowTaxForm(!showTaxForm)} className="text-xs text-primary-700 hover:underline">+ Tambah</button>
            </div>
            {showTaxForm && (
              <form onSubmit={handleTaxSubmit} className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
                <select className="input text-xs py-1.5" value={taxForm.type} onChange={(e) => setTaxForm({ ...taxForm, type: e.target.value })}>
                  <option value="bphtb">BPHTB (Pajak Pembeli)</option>
                  <option value="ssp">SSP (Pajak Penjual)</option>
                  <option value="sps">SPS (BPN)</option>
                </select>
                <input type="number" className="input text-xs py-1.5" placeholder="Nominal (Rp)" value={taxForm.amount} onChange={(e) => setTaxForm({ ...taxForm, amount: e.target.value })} required />
                <input type="date" className="input text-xs py-1.5" value={taxForm.payment_date} onChange={(e) => setTaxForm({ ...taxForm, payment_date: e.target.value })} required />
                <input className="input text-xs py-1.5" placeholder="No. Bukti (opsional)" value={taxForm.receipt_number} onChange={(e) => setTaxForm({ ...taxForm, receipt_number: e.target.value })} />
                <button type="submit" className="btn-primary text-xs py-1.5 w-full justify-center">Simpan</button>
              </form>
            )}
            {ajb.tax_payments?.length === 0 ? <p className="text-xs text-gray-400">Belum ada pembayaran</p> : (
              ajb.tax_payments?.map((t) => (
                <div key={t.id} className="text-xs border-b border-gray-100 pb-2 mb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium uppercase">{t.type}</span>
                    <span className={`badge ${t.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{t.status}</span>
                  </div>
                  <p className="text-gray-700">Rp {Number(t.amount).toLocaleString('id-ID')}</p>
                  <p className="text-gray-400">{new Date(t.payment_date).toLocaleDateString('id-ID')}</p>
                </div>
              ))
            )}
          </div>

          {/* BPN Submission */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Data BPN</h2>
            {ajb.bpn_submission ? (
              <div className="text-xs space-y-1">
                <p><span className="text-gray-500">No. SPA: </span>{ajb.bpn_submission.spa_number ?? '—'}</p>
                <p><span className="text-gray-500">Tgl Submit: </span>{ajb.bpn_submission.submission_date ? new Date(ajb.bpn_submission.submission_date).toLocaleDateString('id-ID') : '—'}</p>
                <p><span className="text-gray-500">No. SPS: </span>{ajb.bpn_submission.sps_number ?? '—'}</p>
                <p><span className="text-gray-500">Nilai SPS: </span>{ajb.bpn_submission.sps_amount ? 'Rp ' + Number(ajb.bpn_submission.sps_amount).toLocaleString('id-ID') : '—'}</p>
                <p><span className="text-gray-500">Status: </span><span className="font-medium capitalize">{ajb.bpn_submission.status}</span></p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Belum ada data BPN</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
