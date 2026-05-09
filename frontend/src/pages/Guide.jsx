import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, Clock, ShieldCheck, Leaf, Tags, Layers } from 'lucide-react';

export default function Guide() {
  const navigate = useNavigate();

  const STEPS = [
    {
      title: 'Pilih Mode Analisis',
      desc: 'Di halaman Beranda, pilih mode yang sesuai dengan kebutuhan Anda: Analisis Tanaman, Baca Label Produk, atau Analisis Lengkap (keduanya).',
      icon: ScanLine,
      color: 'text-primary',
      bg: 'bg-primary-lt'
    },
    {
      title: 'Ambil atau Unggah Foto',
      desc: 'Ambil foto langsung melalui kamera atau pilih gambar dari galeri Anda. Pastikan gambar jelas dan tidak buram.',
      icon: ShieldCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Tunggu Hasil Analisis AI',
      desc: 'Sistem LeafGuard akan memproses foto Anda menggunakan teknologi AI secara real-time. Biasanya ini memakan waktu kurang dari 5 detik.',
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Dapatkan Rekomendasi',
      desc: 'Anda akan menerima hasil diagnosis terperinci, termasuk tingkat urgensi, serta rekomendasi penanganan dan dosis produk (jika label disertakan).',
      icon: Leaf,
      color: 'text-green-600',
      bg: 'bg-green-50'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 
                       flex items-center justify-center
                       hover:bg-gray-50 active:scale-95 transition-all
                       flex-shrink-0"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo/logo_2.svg" alt="" className="w-6 h-6 object-contain" />
            <h1 className="text-lg font-bold text-gray-900">Cara Penggunaan</h1>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="card mb-6 bg-gradient-to-br from-green-500 to-emerald-700 text-white border-none p-5">
          <h2 className="text-xl font-bold mb-2">Selamat Datang di LeafGuard!</h2>
          <p className="text-sm opacity-90 leading-relaxed">
            LeafGuard Tani dirancang untuk membantu Anda mengidentifikasi penyakit pada tanaman padi dan memahami label produk pertanian dengan cepat dan akurat.
          </p>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-4 px-1">Langkah-Langkah Penggunaan</h3>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:ml-8 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative flex items-start">
                <div className={`w-14 h-14 rounded-full ${step.bg} border-4 border-[var(--color-bg)] flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm`}>
                  <Icon size={24} className={step.color} />
                </div>
                <div className="card ml-4 p-4 flex-1 shadow-sm">
                  <h4 className="text-[15px] font-bold text-gray-900 mb-1">{step.title}</h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 mb-4 card bg-amber-50 border-amber-100 p-4">
          <h4 className="font-semibold text-amber-800 text-sm mb-2">Ingat!</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            Kualitas foto sangat menentukan keakuratan analisis. Hindari foto yang terlalu gelap, silau, atau tidak fokus. Pastikan objek memenuhi sebagian besar frame foto.
          </p>
        </div>
      </div>
    </div>
  );
}
