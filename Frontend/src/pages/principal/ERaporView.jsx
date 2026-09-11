import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const TITLES = {
  menunggu: 'Rapor Menunggu Pengesahan',
  review: 'Review Rapor',
  riwayat: 'Riwayat Pengesahan',
}

const DESC = {
  menunggu: 'Daftar rapor siswa yang sudah diajukan dan menunggu disahkan.',
  review: 'Tinjau detail nilai & unduh PDF sebelum memutuskan.',
  riwayat: 'Riwayat rapor yang sudah disahkan atau ditolak.',
}

const STATUS_STYLE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disahkan: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

export default function ERaporView({ tab }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    const params = tab === 'menunggu' ? { status: 'diajukan' } : {}
    api
      .listRaporPengesahan(params)
      .then((res) =>
        setData(tab === 'riwayat' ? res.filter((r) => r.status !== 'diajukan') : res)
      )
      .catch((err) => setError(err.message))
  }

  useEffect(load, [tab])

  async function handleSahkan(item) {
    const catatan = window.prompt(`Catatan pengesahan untuk rapor ${item.siswa?.nama} (opsional):`, '')
    if (catatan === null) return
    setBusyId(item.id)
    try {
      await api.sahkanRapor(item.id, { catatan: catatan || undefined })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleTolak(item) {
    const catatan = window.prompt(`Alasan penolakan untuk rapor ${item.siswa?.nama} (wajib diisi):`, '')
    if (!catatan) return
    setBusyId(item.id)
    try {
      await api.tolakRapor(item.id, { catatan })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDownload(item) {
    try {
      await api.downloadRapor(item.siswa_id, item.semester, item.tahun_ajaran)
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy mb-1">{TITLES[tab]}</h1>
      <p className="text-sm text-navy/50 mb-6">{DESC[tab]}</p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {!data ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
          {data.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-8">
              {tab === 'menunggu' ? 'Tidak ada rapor yang menunggu pengesahan.' : 'Belum ada data.'}
            </p>
          ) : (
            data.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {item.siswa?.nama || '-'}{' '}
                    <span className="text-navy/40 font-normal">({item.siswa?.nis})</span>
                  </p>
                  <p className="text-xs text-navy/50 mt-0.5">
                    Semester {item.semester} {item.tahun_ajaran} · diajukan oleh{' '}
                    {item.diajukan_oleh?.name || '-'}
                  </p>
                  {item.catatan && <p className="text-xs text-navy/40 mt-1">Catatan: {item.catatan}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[item.status]}`}>
                    {item.status}
                  </span>
                  <button
                    onClick={() => handleDownload(item)}
                    className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                  >
                    Lihat PDF
                  </button>
                  {tab !== 'riwayat' && item.status === 'diajukan' && (
                    <>
                      <button
                        onClick={() => handleTolak(item)}
                        disabled={busyId === item.id}
                        className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleSahkan(item)}
                        disabled={busyId === item.id}
                        className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
                      >
                        Sahkan
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
