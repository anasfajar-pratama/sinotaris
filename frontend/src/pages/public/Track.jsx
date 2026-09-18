import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { Search, CheckCircle, Clock, Circle, FileCheck, ArrowLeft } from 'lucide-react'

const STAGE_ICON = {
  completed:   <CheckCircle size={20} className="text-green-500" />,
  in_progress: <Clock size={20} className="text-blue-500 animate-pulse" />,
  pending:     <Circle size={20} className="text-gray-300" />,
}

export default function PublicTrack() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(code ?? '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const search = async (trackCode) => {
    if (!trackCode.trim()) return
    setLoading(true)
    setNotFound(false)
    setResult(null)
    try {
      const res = await api.get(`/track/${trackCode.toUpperCase().trim()}`)
      setResult(res.data)
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (code) search(code)
  }, [code])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) navigate(`/track/${input.trim().toUpperCase()}`)
  }

  const progress = result ? Math.round((result.stages?.filter((s) => s.status === 'completed').length / 5) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 py-10 px-6 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <FileCheck size={18} />
          </div>
          <span className="font-bold text-lg">SiNotaris</span>
        </div>
        <h1 className="text-2xl font-bold">Lacak Status Dokumen</h1>
        <p className="text-primary-200 mt-1 text-sm">Masukkan kode tracking untuk melihat status dokumen Anda</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10 text-base py-3 uppercase tracking-widest"
              placeholder="Masukkan kode tracking..."
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-6 py-3">
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" />
          </div>
        )}

        {notFound && (
          <div className="card p-8 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-lg font-semibold text-gray-900">Dokumen Tidak Ditemukan</h2>
            <p className="text-gray-500 text-sm mt-2">Kode tracking "<span className="font-mono font-bold">{code}</span>" tidak ditemukan. Periksa kembali kode Anda.</p>
          </div>
        )}

        {result && (
          <div className="card overflow-hidden">
            <div className="p-5 bg-primary-50 border-b border-primary-100">
              <p className="text-xs text-primary-600 font-mono mb-1">Kode: {code}</p>
              <h2 className="text-lg font-bold text-gray-900">{result.title}</h2>
              <p className="text-sm text-gray-600">{result.type}</p>
              <p className="text-xs text-gray-500 mt-1">No. {result.doc_number}</p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Progress Dokumen</p>
                <p className="text-sm font-bold text-primary-700">{progress}%</p>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-primary-700'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-4">
                {result.stages?.map((stage, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      {STAGE_ICON[stage.status]}
                      {i < result.stages.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className={`flex-1 pb-3 ${stage.status === 'in_progress' ? 'text-blue-900' : ''}`}>
                      <p className={`font-medium text-sm ${stage.status === 'completed' ? 'text-gray-900' : stage.status === 'in_progress' ? 'text-blue-700' : 'text-gray-400'}`}>
                        {stage.stage_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {stage.status === 'completed' && stage.completed_at
                          ? new Date(stage.completed_at).toLocaleString('id-ID')
                          : stage.status === 'in_progress' ? '⏳ Sedang diproses...'
                          : 'Menunggu'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {result.deadline && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  Estimasi selesai: <span className="font-medium">{new Date(result.deadline).toLocaleDateString('id-ID')}</span>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-sm text-gray-500">Ada pertanyaan? Hubungi kantor kami di <span className="font-semibold">(021) 5678-9012</span></p>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-primary-700 hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft size={14} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
