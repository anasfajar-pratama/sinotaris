import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FileText, Users, Clock, CheckCircle, AlertTriangle, TrendingUp, Activity, Calendar, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']
const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }

const PERIOD_OPTIONS = [
  { value: 'day',   label: 'Hari (Pilih Tanggal Spesifik)', icon: '📅' },
  { value: 'week',  label: 'Minggu (Pilih Minggu ke-N)',    icon: '🗓️' },
  { value: 'month', label: 'Bulan (Pilih Bulan)',           icon: '📅' },
  { value: 'year',  label: 'Tahun (Pilih Tahun)',           icon: '📊' },
]

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [deadlines, setDeadlines] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [period, setPeriod] = useState('')          // '' = semua waktu
  const [date, setDate] = useState('')
  const [week, setWeek] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')

  const now = new Date()
  const defaultYear = now.getFullYear()

  const buildParams = () => {
    const p = {}
    if (!period) return p
    p.period = period
    if (period === 'day' && date) p.date = date
    if (period === 'week' && week) {
      p.year = year || String(defaultYear)
      p.week = week
    }
    if (period === 'month' && month) {
      p.year = year || String(defaultYear)
      p.month = month
    }
    if (period === 'year') p.year = year || String(defaultYear)
    return p
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = buildParams()
        const [statsRes, chartRes, deadRes, actRes] = await Promise.all([
          api.get('/admin/dashboard/stats', { params }),
          api.get('/admin/dashboard/chart-data', { params }),
          api.get('/admin/dashboard/deadlines'),
          api.get('/admin/dashboard/activity', { params }),
        ])
        setStats(statsRes.data)
        setChartData(chartRes.data)
        setDeadlines(deadRes.data.deadlines ?? [])
        setActivity(actRes.data.activities ?? [])
      } catch {}
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, date, week, year, month])

  if (loading && !stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" />
    </div>
  )

  const priorityColor = (d) => d <= 3 ? 'text-red-600 bg-red-50' : d <= 7 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Selamat datang! Berikut ringkasan aktivitas kantor hari ini.</p>
        </div>

        {/* Card filter periode di ujung kanan */}
        <div className="card p-3 w-full sm:w-80 self-start">
          {loading && <span className="sr-only">Memuat...</span>}
          <button
            onClick={() => setPeriodOpen((o) => !o)}
            className="w-full btn-secondary text-sm flex items-center justify-between gap-2"
          >
            <span className="truncate">{period ? periodLabel : 'Pilih Periode Waktu'}</span>
            <ChevronDown size={16} className={periodOpen ? 'rotate-180 transition-transform flex-shrink-0' : 'transition-transform flex-shrink-0'} />
          </button>
          {periodOpen && (
            <div className="mt-1.5 border-t border-gray-100 pt-1.5 space-y-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPeriod(opt.value)
                    setPeriodOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 ${period === opt.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
              {period && (
                <button
                  onClick={() => { setPeriod(''); setDate(''); setWeek(''); setYear(''); setMonth(''); setPeriodOpen(false) }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-50"
                >
                  ✕ Hapus filter (tampilkan semua)
                </button>
              )}
            </div>
          )}

          {/* Sub-input dinamis di dalam card yg sama */}
          {period && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
              {period === 'day' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">📅 Masukkan Tanggal</label>
                  <input type="date" className="input text-sm w-full" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              )}
              {period === 'week' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Tahun</label>
                    <select className="input text-sm w-full" value={year || defaultYear} onChange={(e) => setYear(e.target.value)}>
                      {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Minggu ke-N</label>
                    <select className="input text-sm w-full" value={week} onChange={(e) => setWeek(e.target.value)}>
                      <option value="">Pilih minggu...</option>
                      {Array.from({ length: 53 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Minggu ke-{w}</option>)}
                    </select>
                  </div>
                </>
              )}
              {period === 'month' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Tahun</label>
                    <select className="input text-sm w-full" value={year || defaultYear} onChange={(e) => setYear(e.target.value)}>
                      {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Bulan</label>
                    <select className="input text-sm w-full" value={month} onChange={(e) => setMonth(e.target.value)}>
                      <option value="">Pilih bulan...</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{new Date(defaultYear, m - 1, 1).toLocaleString('id-ID', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {period === 'year' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tahun</label>
                  <select className="input text-sm w-full" value={year || defaultYear} onChange={(e) => setYear(e.target.value)}>
                    {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {period === 'day' && date && (
                <p className="text-xs text-gray-400">Menampilkan data {new Date(date + 'T00:00:00').toLocaleDateString('id-ID')}</p>
              )}
              {period !== 'day' && (period === 'year' || month || week) && (
                <p className="text-xs text-gray-400">
                  {period === 'year' && `Tahun ${year || defaultYear}`}
                  {period === 'month' && month && `Bulan ${new Date(defaultYear, Number(month) - 1, 1).toLocaleString('id-ID', { month: 'long' })} ${year || defaultYear}`}
                  {period === 'week' && week && `Minggu ke-${week} ${year || defaultYear}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Order" value={stats?.total_documents} color="bg-primary-600" sub={period ? `${stats?.in_progress} masih diproses` : `${stats?.in_progress} sedang diproses`} />
        <StatCard icon={CheckCircle} label="Selesai" value={stats?.completed} color="bg-green-600" sub={period ? `${stats?.completed_in_period} selesai di periode` : `${stats?.monthly_completed} bulan ini`} />
        <StatCard icon={Clock} label="Pending Review" value={stats?.pending_review} color="bg-yellow-500" />
        <StatCard icon={AlertTriangle} label="Hampir Deadline" value={stats?.overdue} color="bg-red-500" sub="dalam 14 hari ke depan" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Klien" value={stats?.total_clients} color="bg-purple-600" sub={period ? 'terdaftar di periode' : undefined} />
        <StatCard icon={TrendingUp} label="Kasus AJB Aktif" value={stats?.active_ajb} color="bg-indigo-600" sub={period ? `dari ${stats?.total_ajb} di periode` : `dari ${stats?.total_ajb} total`} />
        <StatCard icon={Activity} label="Selesai di Periode" value={stats?.completed_in_period ?? stats?.monthly_completed} color="bg-teal-600" sub={period ? undefined : 'bulan ini'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tren Chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {period === 'day' ? 'Tren Order (14 Hari Terakhir)'
              : period === 'week' ? 'Tren Order (8 Minggu Terakhir)'
                : period === 'year' ? 'Tren Order (Per Bulan)'
                  : 'Tren Order (6 Bulan)'}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData?.monthly_trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="created" name="Dibuat" fill="#93c5fd" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="Selesai" fill="#1d4ed8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Status Order</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={chartData?.by_status ?? []} dataKey="total" nameKey="status" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                {(chartData?.by_status ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, STATUS_LABELS[n] || n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {(chartData?.by_status ?? []).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-600">{STATUS_LABELS[item.status] || item.status}</span>
                </div>
                <span className="font-medium">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-orange-500" />
              Deadline Mendatang
            </h2>
            <Link to="/admin/documents" className="text-xs text-primary-700 hover:underline">Lihat semua</Link>
          </div>
          {deadlines.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Tidak ada deadline dalam 14 hari ke depan</p>
          ) : (
            <div className="space-y-2">
              {deadlines.map((d) => (
                <Link key={d.id} to={`/admin/documents/${d.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                    <p className="text-xs text-gray-500">{d.client_name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ml-3 flex-shrink-0 ${priorityColor(d.days_left)}`}>
                    {d.days_left <= 0 ? 'Terlambat' : `${d.days_left}h`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              Aktivitas Terbaru
            </h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada aktivitas</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-700">
                    {a.user?.charAt(0) ?? 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{a.user}</span>
                      {' '}{a.action === 'created' ? 'membuat' : a.action === 'updated' ? 'memperbarui' : 'menghapus'}{' '}
                      <span className="text-primary-700">{a.module}</span>
                    </p>
                    <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
