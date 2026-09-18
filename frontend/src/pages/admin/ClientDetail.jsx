import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, FileText, User } from 'lucide-react'

const STATUS_STYLES = { draft: 'badge-gray', in_progress: 'badge-blue', review: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }
const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }

export default function AdminClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [clientRes, docsRes] = await Promise.all([
          api.get(`/admin/clients/${id}`),
          api.get(`/admin/clients/${id}/documents`),
        ])
        setClient(clientRes.data.client)
        setDocuments(docsRes.data.data ?? docsRes.data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
  if (!client) return <div className="text-center py-20 text-gray-500">Klien tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/clients" className="btn-secondary"><ArrowLeft size={16} /> Kembali</Link>
        <h1 className="text-xl font-bold text-gray-900">Profil Klien</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700 mb-3">
              {client.name?.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
            <p className="text-gray-500 text-sm">{client.email ?? 'Email tidak tersedia'}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">NIK</span><span className="font-medium font-mono">{client.nik ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Telepon</span><span className="font-medium">{client.phone ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">NPWP</span><span className="font-medium font-mono text-xs">{client.npwp ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Kelamin</span><span className="font-medium">{client.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span></div>
            {client.birth_date && <div className="flex justify-between"><span className="text-gray-500">Tgl Lahir</span><span className="font-medium">{new Date(client.birth_date).toLocaleDateString('id-ID')}</span></div>}
          </div>
          {client.address && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm mb-1">Alamat</p>
              <p className="text-sm">{client.address}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} /> Riwayat Order
            </h2>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada order untuk klien ini</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Link key={doc.id} to={`/admin/documents/${doc.id}`} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.doc_number} · {doc.document_type?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_STYLES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                      <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
