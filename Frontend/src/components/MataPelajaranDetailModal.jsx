import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const JENIS_LABEL = {
  wajib: 'Wajib',
  pilihan: 'Pilihan',
  muatan_lokal: 'Muatan Lokal',
  lainnya: 'Lainnya',
}

const BELUM_TERSEDIA = [
  ['Capaian Pembelajaran', 'Pengelolaan Capaian Pembelajaran (CP) per fase belum tersedia.'],
  ['Tujuan Pembelajaran', 'Pengelolaan Tujuan Pembelajaran (TP) turunan dari CP belum tersedia.'],
  ['Kompetensi', 'Pemetaan kompetensi inti & dasar belum tersedia.'],
  ['KKTP', 'Kriteria Ketuntasan Tujuan Pembelajaran belum tersedia.'],
  ['Program Semester', 'Penyusunan program semester belum tersedia.'],
  ['Program Tahunan', 'Penyusunan program tahunan belum tersedia.'],
]

export default function MataPelajaranDetailModal({ mapelId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMataPelajaran(mapelId).then(setDetail).catch((err) => setError(err.message))
  }, [mapelId])

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-2xl w-full shadow-2xl shadow-teal-900/20 max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!detail && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

        {detail && (
          <>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-extrabold text-navy">{detail.nama_mapel}</h2>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  detail.status === 'nonaktif' ? 'bg-navy/10 text-navy/50' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {detail.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
              </span>
            </div>
            {detail.deskripsi && <p className="text-sm text-navy/50 mb-4">{detail.deskripsi}</p>}

            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-5 bg-navy/5 rounded-2xl p-4">
              <Row label="Kode" value={detail.kode_mapel} />
              <Row label="Kelompok" value={detail.kelompok || '-'} />
              <Row label="Jenis" value={JENIS_LABEL[detail.jenis] || '-'} />
              <Row label="Kelas" value={detail.jenjang || '-'} />
              <Row label="Alokasi JP Default" value={detail.alokasi_jp_default != null ? `${detail.alokasi_jp_default} JP/minggu` : '-'} />
              <Row label="Total JP (struktur aktif)" value={`${detail.total_jp_aktif} JP/minggu`} />
            </dl>

            <div className="mb-5">
              <h3 className="text-sm font-bold text-navy mb-2">Guru Pengampu</h3>
              {detail.guru_pengampu.length === 0 ? (
                <p className="text-xs text-navy/40">Belum ada guru yang terjadwal mengajar mata pelajaran ini.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.guru_pengampu.map((g) => (
                    <span key={g.id} className="text-xs font-medium text-navy bg-navy/5 rounded-full px-3 py-1.5">
                      {g.nama}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-bold text-navy mb-2">Dipakai di Struktur Kurikulum</h3>
              {detail.struktur_pemakai.length === 0 ? (
                <p className="text-xs text-navy/40">Belum dipakai di struktur kurikulum manapun.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.struktur_pemakai.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white border border-navy/10 rounded-lg px-3 py-2">
                      <span className="text-navy/70">
                        {s.kurikulum} — Tingkat {s.tingkat}
                        {s.fase ? ` Fase ${s.fase}` : ''} ({s.tahun_ajaran})
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-navy">{s.jp_per_minggu} JP/minggu</span>
                        {s.is_aktif && <span className="text-emerald-600 font-semibold">Aktif</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-navy mb-2">Perangkat Pembelajaran</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {BELUM_TERSEDIA.map(([title, desc]) => (
                  <div key={title} className="border border-dashed border-navy/15 rounded-xl p-3">
                    <p className="text-xs font-semibold text-navy/70">{title}</p>
                    <p className="text-[11px] text-navy/40 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm py-0.5">
      <dt className="text-navy/50">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  )
}
