import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FileText, Search, Eye } from 'lucide-react'

const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }
const STATUS_STYLES = { draft: 'badge-gray', in_progress: 'badge-blue', review: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/client/documents', { params: { search } })
      .then((res) => setDocuments(res.data.data ?? res.data))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dokumen Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Daftar semua dokumen yang sedang atau telah diproses</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 w-full max-w-md" placeholder="Cari dokumen..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
      ) : documents.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-gray-400">
          <FileText size={40} className="mb-2 opacity-30" />
          <p>Tidak ada dokumen ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Link key={doc.id} to={`/client/documents/${doc.id}`} className="card flex items-center justify-between p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={22} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{doc.title}</p>
                  <p className="text-sm text-gray-500">{doc.doc_number}</p>
                  <p className="text-xs text-gray-400">{doc.document_type?.name}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={STATUS_STYLES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                {doc.deadline && (
                  <p className="text-xs text-gray-400 mt-1">
                    Deadline: {new Date(doc.deadline).toLocaleDateString('id-ID')}
                  </p>
                )}
                <p className="text-xs text-gray-400">Tahap {doc.current_stage}/5</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
