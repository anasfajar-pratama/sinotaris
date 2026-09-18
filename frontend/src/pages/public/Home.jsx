import { Link } from 'react-router-dom'
import { FileCheck, Search, Shield, Clock, ArrowRight, Phone, Mail, MapPin } from 'lucide-react'

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-primary-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <span className="font-bold text-lg">SiNotaris</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/track" className="text-primary-200 hover:text-white text-sm transition-colors">Lacak Dokumen</Link>
            <Link to="/login" className="bg-white text-primary-900 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors">Masuk</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Sistem Online & Siap Melayani
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Kantor Notaris/PPAT<br />
            <span className="text-primary-200">Digital & Transparan</span>
          </h1>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Pantau status dokumen notaris Anda secara real-time. Proses cepat, transparan, dan terdokumentasi dengan baik.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/track" className="bg-white text-primary-900 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center gap-2">
              <Search size={18} /> Lacak Dokumen Saya
            </Link>
            <Link to="/login" className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors">
              Login Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Layanan Notaris Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Akta Jual Beli (AJB)', desc: 'Peralihan hak atas tanah dan bangunan melalui proses yang resmi dan terdokumentasi.' },
              { title: 'Akta Hibah', desc: 'Pemindahan hak milik secara cuma-cuma dengan dasar hukum yang kuat.' },
              { title: 'Akta Waris', desc: 'Pembagian harta warisan sesuai ketentuan hukum yang berlaku.' },
              { title: 'Pendirian PT / CV', desc: 'Pembuatan akta pendirian badan hukum perusahaan.' },
              { title: 'Perjanjian Pranikah', desc: 'Perlindungan aset sebelum pernikahan dengan perjanjian resmi.' },
              { title: 'Legalisasi Dokumen', desc: 'Pengesahan dokumen untuk keperluan resmi domestik dan internasional.' },
            ].map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
                  <FileCheck size={18} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">Mengapa Memilih Kami?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Proses Cepat', desc: 'Sistem digital mempercepat setiap tahapan proses dokumen' },
              { icon: Shield, title: 'Aman & Terpercaya', desc: 'Dokumen Anda tersimpan aman dengan enkripsi dan audit trail' },
              { icon: Search, title: 'Transparan', desc: 'Lacak status dokumen Anda kapan saja secara real-time' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-primary-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Hubungi Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="card p-5">
              <Phone size={24} className="text-primary-600 mx-auto mb-2" />
              <p className="font-semibold">Telepon</p>
              <p className="text-gray-500 text-sm">(021) 5678-9012</p>
            </div>
            <div className="card p-5">
              <Mail size={24} className="text-primary-600 mx-auto mb-2" />
              <p className="font-semibold">Email</p>
              <p className="text-gray-500 text-sm">info@notarisrahayu.id</p>
            </div>
            <div className="card p-5">
              <MapPin size={24} className="text-primary-600 mx-auto mb-2" />
              <p className="font-semibold">Alamat</p>
              <p className="text-gray-500 text-sm">Jl. Sudirman No. 100, Jakarta Pusat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-primary-200 py-8 px-6 text-center text-sm">
        <p>© {new Date().getFullYear()} SiNotaris — Kantor Notaris/PPAT. Semua Hak Dilindungi.</p>
        <p className="mt-1 flex items-center justify-center gap-4">
          <Link to="/track" className="hover:text-white">Lacak Dokumen</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-white">Login</Link>
        </p>
      </footer>
    </div>
  )
}
