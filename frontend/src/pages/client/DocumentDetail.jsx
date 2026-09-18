import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { storageUrl } from '../../services/api'
import { ArrowLeft, CheckCircle, Clock, Circle, Download, FileText, Eye } from 'lucide-react'

const STAGE_ICON = {
  completed:   <CheckCircle size={22} className="text-green-500" />,
  in_progress: <Clock size={22} className="text-blue-500 animate-pulse" />,
  pending:     <Circle size={22} className="text-gray-300" />,
}

const MARITAL_LABELS = { single: 'Lajang', married: 'Menikah', widowed: 'Cerai' }
const isImageUrl = (url) => /\.(webp|jpg|jpeg|png)$/i.test(url || '')

function DocViewRow({ doc }) {
  const url = storageUrl(doc.url)
  const img = isImageUrl(url)
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {img
          ? <img src={url} alt={doc.original_name} className="h-10 w-10 object-cover rounded-lg border border-gray-200 shrink-0" />
          : <FileText size={16} className="text-gray-500 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm text-gray-700 truncate">{doc.original_name}</p>
          <p className="text-xs text-gray-400 truncate">{doc.document_catalog?.label ?? 'Dokumen'}</p>
        </div>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1 px-3 shrink-0">
        <Eye size={14} /> Lihat
      </a>
    </div>
  )
}

export default function ClientDocumentDetail() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/client/documents/${id}`).then((res) => setDoc(res.data.document)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
  if (!doc) return <div className="text-center py-20 text-gray-500">Dokumen tidak ditemukan</div>

  const completedStages = doc.stages?.filter((s) => s.status === 'completed').length ?? 0
  const progress = Math.round((completedStages / 5) * 100)

  return (
    <div className="space-y-6">
      <Link to="/client/documents" className="btn-secondary inline-flex"><ArrowLeft size={16} /> Kembali</Link>

      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{doc.doc_number}</p>
            <p className="text-xs text-gray-400">Kode Tracking: <span className="font-mono">{doc.tracking_code}</span></p>
          </div>
          <span className={`badge ${doc.status === 'completed' ? 'badge-green' : doc.status === 'in_progress' ? 'badge-blue' : 'badge-gray'}`}>
            {doc.status === 'completed' ? 'Selesai' : doc.status === 'in_progress' ? 'Diproses' : doc.status}
          </span>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-bold text-primary-700">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pb-5 border-b border-gray-100">
          <div><p className="text-gray-500">Jenis</p><p className="font-medium">{doc.document_type?.name}</p></div>
          <div><p className="text-gray-500">Prioritas</p><p className="font-medium capitalize">{doc.priority}</p></div>
          <div><p className="text-gray-500">Deadline</p><p className="font-medium">{doc.deadline ? new Date(doc.deadline).toLocaleDateString('id-ID') : '—'}</p></div>
        </div>

        {/* Timeline */}
        <div className="mt-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Status Proses</h2>
          <div className="space-y-4">
            {doc.stages?.map((stage, i) => (
              <div key={stage.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {STAGE_ICON[stage.status]}
                  {i < (doc.stages.length - 1) && <div className="w-0.5 flex-1 bg-gray-200 mt-1 mb-1" />}
                </div>
                <div className={`flex-1 pb-3 ${stage.status === 'in_progress' ? 'text-blue-900' : ''}`}>
                  <p className={`font-semibold text-sm ${stage.status === 'in_progress' ? 'text-blue-700' : 'text-gray-900'}`}>
                    {stage.stage_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {stage.status === 'completed' && stage.completed_at
                      ? `Selesai pada ${new Date(stage.completed_at).toLocaleString('id-ID')}`
                      : stage.status === 'in_progress'
                      ? 'Sedang diproses...'
                      : 'Menunggu'}
                  </p>
                  {stage.notes && stage.status === 'completed' && (
                    <p className="text-xs text-gray-500 italic mt-0.5">{stage.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dokumen Order */}
      {doc.order_documents?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Dokumen Order</h2>
          <div className="space-y-2">
            {doc.order_documents.map((d) => <DocViewRow key={d.id} doc={d} />)}
          </div>
        </div>
      )}

      {/* Pihak Terlibat */}
      {doc.actors?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Pihak Terlibat</h2>
          <div className="space-y-4">
            {doc.actors.map((actor) => (
              <div key={actor.id} className="border border-gray-100 rounded-xl p-4">
                <p className="font-medium text-sm text-gray-900 mb-2">{actor.actor_type?.label ?? 'Pihak'}</p>
                {Object.keys(actor.data ?? {}).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm mb-3">
                    {Object.entries(actor.data ?? {}).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-gray-400 text-xs capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="text-gray-800">{k === 'marital_status' ? (MARITAL_LABELS[v] ?? v) : String(v ?? '—')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {actor.documents?.length > 0 && (
                  <div className="space-y-2">
                    {actor.documents.map((d) => <DocViewRow key={d.id} doc={d} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aset */}
      {doc.assets?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Aset</h2>
          <div className="space-y-4">
            {doc.assets.map((asset) => (
              <div key={asset.id} className="border border-gray-100 rounded-xl p-4">
                <p className="font-medium text-sm text-gray-900 mb-2">{asset.asset_type?.label ?? 'Aset'}</p>
                {Object.keys(asset.data ?? {}).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm mb-3">
                    {Object.entries(asset.data ?? {}).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-gray-400 text-xs capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="text-gray-800">{String(v ?? '—')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {asset.documents?.length > 0 && (
                  <div className="space-y-2">
                    {asset.documents.map((d) => <DocViewRow key={d.id} doc={d} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Berkas Tersedia */}
      {doc.files?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Berkas Tersedia</h2>
          <div className="space-y-2">
            {doc.files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">{f.original_name}</span>
                </div>
                <a href={`/client/documents/${id}/download/${f.id}`} className="btn-secondary text-xs py-1 px-3">
                  <Download size={14} /> Unduh
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
