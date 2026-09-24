import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import PenerbitanRaporPrint from './PenerbitanRaporPrint'
import RaporDocument from './RaporDocument'

const STATUS_TONE = {
  belum: 'bg-navy/10 text-navy/60',
  draft: 'bg-amber-100 text-amber-700',
  diajukan: 'bg-sky-100 text-sky-700',
  disahkan: 'bg-indigo-100 text-indigo-700',
  ditolak: 'bg-red-100 text-red-700',
  diterbitkan: 'bg-emerald-100 text-emerald-700',
  dicabut: 'bg-orange-100 text-orange-700',
}

export default function PenerbitanRaporPreviewModal({ row, params, hak, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [tanggalTerbit, setTanggalTerbit] = useState(new Date().toISOString().slice(0, 10))
  const [cetak, setCetak] = useState(false)
  const [versi, setVersi] = useState(0)

  const siswaId = row.siswa.id

  useEffect(() => {
    api
      .previewPenerbitanRapor({ ...params, siswa_id: siswaId })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [params, siswaId, versi])

  async function jalankan(fn) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const res = await fn()
      const lewat = res.dilewati?.length ? ` ${res.dilewati.join(' ')}` : ''
      setNotice(`${res.message ?? ''}${lewat}`)
      setVersi((v) => v + 1)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const base = { ...params, siswa_ids: [siswaId] }
  const status = data?.status_rapor
  const validasi = data?.validasi ?? []
  const blokirTerbit = validasi.filter((v) => v.blokir_terbit)

  function tolak() {
    const catatan = window.prompt('Alasan penolakan pengesahan (wajib):')
    if (catatan) jalankan(() => api.pengesahanPenerbitanRapor({ ...base, aksi: 'tolak', catatan }))
  }

  function cabut() {
    const alasan = window.prompt('Alasan mencabut penerbitan (wajib, min. 5 karakter):')
    if (alasan) jalankan(() => api.cabutRapor({ ...params, siswa_id: siswaId, alasan }))
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-5xl w-full shadow-2xl shadow-teal-900/20 max-h-[92vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-extrabold text-navy">Rapor {row.siswa.nama}</h2>
            <p className="text-xs text-navy/50 capitalize">
              {row.kelas.nama_kelas} · Semester {params.semester} {data && <span className={`ml-2 font-semibold px-2 py-0.5 rounded-full ${STATUS_TONE[status]}`}>{data.status_rapor_label}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        {notice && <p className="text-emerald-700 text-xs mb-2">{notice}</p>}
        {!data && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

        {data && (
          <div className="grid lg:grid-cols-[1fr_290px] gap-4">
            <div className="overflow-x-auto">
              <RaporDocument konten={data.konten} />
            </div>

            <div className="space-y-3">
              <div className="border border-navy/10 rounded-xl p-3">
                <p className="text-xs font-bold text-navy mb-1.5">Validasi Kelengkapan Data</p>
                {validasi.length === 0 ? (
                  <p className="text-xs text-emerald-700">✓ Semua syarat terpenuhi.</p>
                ) : (
                  <ul className="space-y-1">
                    {validasi.map((v) => (
                      <li key={v.kode} className={`text-[11px] ${v.blokir_terbit || v.blokir_generate ? 'text-red-700' : 'text-amber-700'}`}>
                        {v.blokir_generate ? '✕' : v.blokir_terbit ? '✕' : '!'} {v.pesan}
                      </li>
                    ))}
                  </ul>
                )}
                {status !== 'diterbitkan' && blokirTerbit.length > 0 && <p className="text-[10px] text-navy/40 mt-1.5">✕ = harus dipenuhi sebelum diterbitkan.</p>}
                {data.pengesahan?.catatan && <p className="text-[11px] text-navy/60 mt-2 bg-navy/5 rounded p-1.5">Catatan pengesahan: {data.pengesahan.catatan}</p>}
              </div>

              <div className="border border-navy/10 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-navy">Tindakan</p>
                {hak.menerbitkan && status !== 'diterbitkan' && (
                  <Btn disabled={busy} onClick={() => jalankan(() => api.generatePenerbitanRapor(base))}>
                    {status === 'belum' || status === 'dicabut' ? 'Generate Rapor' : 'Generate Ulang'}
                  </Btn>
                )}
                {hak.menerbitkan && (status === 'draft' || status === 'ditolak') && (
                  <Btn disabled={busy} primary onClick={() => jalankan(() => api.ajukanPenerbitanRapor(base))}>
                    Ajukan Pengesahan
                  </Btn>
                )}
                {status === 'diajukan' && (
                  <>
                    {hak.mengesahkan ? (
                      <div className="flex gap-2">
                        <Btn disabled={busy} primary onClick={() => jalankan(() => api.pengesahanPenerbitanRapor({ ...base, aksi: 'sahkan' }))}>
                          Sahkan
                        </Btn>
                        <Btn disabled={busy} danger onClick={tolak}>
                          Tolak
                        </Btn>
                      </div>
                    ) : (
                      <p className="text-[11px] text-navy/50">Menunggu pengesahan Kepala Sekolah.</p>
                    )}
                  </>
                )}
                {hak.menerbitkan && status === 'disahkan' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-navy/70">
                      Tanggal penerbitan
                      <input type="date" value={tanggalTerbit} onChange={(e) => setTanggalTerbit(e.target.value)} className="input mt-0.5" />
                    </label>
                    <Btn disabled={busy || blokirTerbit.length > 0 || !tanggalTerbit} primary onClick={() => jalankan(() => api.terbitkanRapor({ ...base, tanggal_terbit: tanggalTerbit }))}>
                      Terbitkan Rapor
                    </Btn>
                  </div>
                )}
                {hak.menerbitkan && status === 'diterbitkan' && (
                  <Btn disabled={busy} danger onClick={cabut}>
                    Cabut Penerbitan
                  </Btn>
                )}
                {!hak.menerbitkan && <p className="text-[11px] text-amber-700">Akun Anda tidak memiliki hak menerbitkan rapor (rapor.publish).</p>}
                <hr className="border-navy/10" />
                <Btn onClick={() => setCetak(true)}>Cetak</Btn>
                <Btn onClick={() => api.downloadRaporSiswa({ ...params, siswa_id: siswaId }, `rapor-${row.siswa.nis || siswaId}`).catch((e) => setError(e.message))}>Download PDF</Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {cetak && data && <PenerbitanRaporPrint items={[data.konten]} onClose={() => setCetak(false)} />}
    </div>
  )
}

function Btn({ primary, danger, children, ...props }) {
  const tone = primary
    ? 'bg-navy text-white border-navy hover:bg-navy-light'
    : danger
      ? 'text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
      : 'text-navy border-navy/20 hover:bg-navy hover:text-white'
  return (
    <button {...props} className={`w-full text-xs font-semibold rounded-md px-3 py-2 border transition-colors disabled:opacity-40 ${tone}`}>
      {children}
    </button>
  )
}
