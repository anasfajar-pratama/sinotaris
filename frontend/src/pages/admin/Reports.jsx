import { useEffect, useState } from 'react'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminReports() {
  const [chartData, setChartData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/admin/dashboard/chart-data'),
    ]).then(([s, c]) => {
      setStats(s.data)
      setChartData(c.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleExport = async (type) => {
    setExporting(true)
    try {
      const res = await api.get(`/admin/reports/export/${type}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-order.${type}`
      a.click()
      toast.success(`Laporan ${type.toUpperCase()} berhasil diunduh`)
    } catch {
      toast.error('Gagal mengunduh laporan')
    }
    setExporting(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Statistik</h1>
          <p className="text-gray-500 text-sm mt-1">Analisis performa dan aktivitas kantor</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={exporting} className="btn-secondary text-sm">
            <Download size={16} /> PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={exporting} className="btn-secondary text-sm">
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Order', value: stats?.total_documents, color: 'text-blue-700' },
          { label: 'Selesai', value: stats?.completed, color: 'text-green-700' },
          { label: 'Total Klien', value: stats?.total_clients, color: 'text-purple-700' },
          { label: 'Kasus AJB', value: stats?.total_ajb, color: 'text-indigo-700' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tren 6 Bulan Terakhir</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData?.monthly_trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="created" name="Dibuat" fill="#bfdbfe" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="Selesai" fill="#1d4ed8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Distribusi Jenis Order</h2>
          {chartData?.by_type?.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData?.by_type ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" name="Jumlah" fill="#1d4ed8" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
