import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import LaporanPrint from './LaporanPrint'
import LaporanTampilan from './LaporanTampilan'
import { Btn, Field, Kosong, Pesan } from './PpdbUI'
import { selectClass } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'
const SORT = {
  siswa: [['rombel', 'Rombel'], ['nama', 'Nama'], ['nis', 'NIS'], ['kelas', 'Kelas'], ['jenis_kelamin', 'Jenis kelamin'], ['status', 'Status']],
  kelas: [['tingkat', 'Tingkat'], ['rombel', 'Rombel'], ['jumlah', 'Jumlah siswa'], ['kapasitas', 'Kapasitas']],
  mutasi: [['tanggal', 'Tanggal'], ['nama', 'Nama'], ['jenis', 'Jenis mutasi']],
}

/**
 * Menjalankan satu jenis laporan kesiswaan: mengambil preview, pengaturan laporan (kolom, urutan, tanggal, logo, tanda tangan),
 * lalu export Excel/PDF dan cetak. Semua tab laporan memakai komponen ini agar perilakunya sama.
 */
export default function LaporanKesiswaanRunner({ jenis, params, opsi, siap = true, pesanSiap, aksiBaris, muatUlang = 0, onArsipBaru, onBukaPengaturan }) {
  const [pengaturan, setPengaturan] = useState({ kolom: null, urut: '', arah: 'asc', tanggal: '', logo: true, ttd: true })
  const [panel, setPanel] = useState(false)
  const [laporan, setLaporan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cari, setCari] = useState('')
  const [cetak, setCetak] = useState(false)
  const [sibuk, setSibuk] = useState('')

  const kolomOpsi = opsi.kolom[jenis]
  const semua = useMemo(() => {
    const p = { ...params }
    if (pengaturan.kolom?.length && kolomOpsi) p.kolom = pengaturan.kolom.join(',')
    if (pengaturan.urut) {
      p.urut = pengaturan.urut
      p.arah = pengaturan.arah
    }
    if (pengaturan.tanggal) p.tanggal_laporan = pengaturan.tanggal
    if (!pengaturan.logo) p.logo = '0'
    if (!pengaturan.ttd) p.ttd = '0'
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== null && v !== undefined))
  }, [params, pengaturan, kolomOpsi])
  const kunci = JSON.stringify(semua)

  useEffect(() => {
    if (!siap || !params.tahun_ajaran_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLaporan(null)
      return
    }
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api
      .lkLaporan(jenis, semua)
      .then((r) => !batal && (setLaporan(r), setError('')))
      .catch((e) => !batal && (setLaporan(null), setError(e.message)))
      .finally(() => !batal && setLoading(false))
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenis, kunci, siap, muatUlang])

  async function unduh(format) {
    setSibuk(format)
    setError('')
    setInfo('')
    try {
      await api.lkExport(jenis, semua, format)
      setInfo(`Laporan ${format === 'xlsx' ? 'Excel' : 'PDF'} diunduh dan disimpan di Arsip & Riwayat Laporan.`)
      onArsipBaru?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk('')
    }
  }

  const toggleKolom = (k) =>
    setPengaturan((p) => {
      const sekarang = p.kolom ?? kolomOpsi.map((x) => x.key)
      const baru = sekarang.includes(k) ? sekarang.filter((x) => x !== k) : [...sekarang, k]
      return { ...p, kolom: baru.length ? baru : sekarang }
    })
  const geser = (k, arah) =>
    setPengaturan((p) => {
      const l = [...(p.kolom ?? kolomOpsi.map((x) => x.key))]
      const i = l.indexOf(k)
      const j = i + arah
      if (i < 0 || j < 0 || j >= l.length) return p
      ;[l[i], l[j]] = [l[j], l[i]]
      return { ...p, kolom: l }
    })

  const urutanKolom = pengaturan.kolom ?? kolomOpsi?.map((x) => x.key) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari di dalam preview…" className={`${selectClass} w-56`} />
        <Btn onClick={() => setPanel((p) => !p)}>{panel ? 'Tutup Pengaturan Laporan' : 'Pengaturan Laporan'}</Btn>
        <span className="flex-1" />
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('xlsx')}>
          {sibuk === 'xlsx' ? 'Menyiapkan…' : 'Export Excel'}
        </Btn>
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('pdf')}>
          {sibuk === 'pdf' ? 'Menyiapkan…' : 'Export PDF'}
        </Btn>
        <Btn utama disabled={!laporan} onClick={() => setCetak(true)}>
          Cetak
        </Btn>
      </div>

      {panel && (
        <div className="bg-white border border-navy/10 rounded-2xl p-4 space-y-4">
          <div className="grid sm:grid-cols-4 gap-3">
            {SORT[jenis] && (
              <>
                <Field label="Urutkan data menurut">
                  <select value={pengaturan.urut} onChange={(e) => setPengaturan((p) => ({ ...p, urut: e.target.value }))} className={input}>
                    <option value="">Bawaan</option>
                    {SORT[jenis].map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Arah">
                  <select value={pengaturan.arah} onChange={(e) => setPengaturan((p) => ({ ...p, arah: e.target.value }))} className={input}>
                    <option value="asc">A → Z / naik</option>
                    <option value="desc">Z → A / turun</option>
                  </select>
                </Field>
              </>
            )}
            <Field label="Tanggal laporan">
              <input type="date" value={pengaturan.tanggal} onChange={(e) => setPengaturan((p) => ({ ...p, tanggal: e.target.value }))} className={input} />
            </Field>
            <div className="flex flex-col gap-2 justify-end text-sm text-navy">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={pengaturan.logo} onChange={(e) => setPengaturan((p) => ({ ...p, logo: e.target.checked }))} /> Tampilkan logo sekolah
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={pengaturan.ttd} onChange={(e) => setPengaturan((p) => ({ ...p, ttd: e.target.checked }))} /> Tampilkan tanda tangan
              </label>
            </div>
          </div>
          {kolomOpsi && (
            <div>
              <p className="text-xs font-bold text-navy mb-1">Kolom pada tabel utama</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {kolomOpsi.map((k) => {
                  const aktif = urutanKolom.includes(k.key)
                  return (
                    <button key={k.key} onClick={() => toggleKolom(k.key)} className={`text-xs font-semibold px-3 py-1 rounded-full border ${aktif ? 'bg-navy text-white border-navy' : 'border-navy/20 text-navy/50'}`}>
                      {k.label}
                    </button>
                  )
                })}
                <button onClick={() => setPengaturan((p) => ({ ...p, kolom: null }))} className="text-xs font-semibold text-navy/50 hover:text-navy px-2">
                  Semua kolom
                </button>
              </div>
              <p className="text-[11px] text-navy/40 mb-1">Urutan kolom (klik panah untuk menggeser):</p>
              <div className="flex flex-wrap gap-1.5">
                {urutanKolom.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 text-[11px] bg-navy/5 rounded-full px-2 py-0.5">
                    <button onClick={() => geser(k, -1)} className="text-navy/40 hover:text-navy">
                      ‹
                    </button>
                    {kolomOpsi.find((x) => x.key === k)?.label}
                    <button onClick={() => geser(k, 1)} className="text-navy/40 hover:text-navy">
                      ›
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-navy/50">
            Kop/header sekolah, kota, dan nama pejabat penandatangan diatur di tab{' '}
            <button onClick={onBukaPengaturan} className="font-semibold text-navy-light hover:underline">
              Pengaturan Kop & Tanda Tangan
            </button>
            .
          </p>
        </div>
      )}

      <Pesan error={error} info={info} />
      {!siap && <Kosong>{pesanSiap}</Kosong>}
      {siap && loading && !laporan && <Kosong>Memuat laporan…</Kosong>}
      {siap && laporan && (
        <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
          <p className="text-xs text-navy/50 mb-3">
            {laporan.judul} · Tahun Ajaran {laporan.konteks.tahun_ajaran} · Semester {laporan.konteks.semester === 'ganjil' ? 'Ganjil' : laporan.konteks.semester === 'genap' ? 'Genap' : 'Semua'} · Periode {laporan.konteks.periode}
          </p>
          <LaporanTampilan laporan={laporan} cari={cari} aksiBaris={aksiBaris} />
        </div>
      )}
      {cetak && laporan && (
        <LaporanPrint
          laporan={laporan}
          onCetak={() => api.lkCatatCetak(jenis, semua).then(() => onArsipBaru?.()).catch(() => {})}
          onClose={() => setCetak(false)}
        />
      )}
    </div>
  )
}
