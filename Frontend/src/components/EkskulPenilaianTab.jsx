import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { TONE_NILAI, TONE_PREDIKAT, saranDeskripsi } from './ekskulKonstanta'
import { Badge, Btn, Kartu, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { selectClass } from './ppdbKonstanta'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #ekskul-nilai-print, #ekskul-nilai-print * { visibility: visible !important; }
  #ekskul-nilai-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .ekn-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

function rataAspek(aspek) {
  const v = Object.values(aspek).filter((x) => x !== '' && x !== null && x !== undefined).map(Number)
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null
}
function predikatDari(n) {
  return n === null ? null : n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : 'D'
}

function Cetak({ d, opsi, onClose }) {
  const [sekolah, setSekolah] = useState(null)
  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
  }, [])
  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="ekn-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Penilaian</p>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>
      <div id="ekskul-nilai-print" className="max-w-[1050px] mx-auto p-8 text-[10.5px] text-black">
        <div className="text-center mb-3">
          <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          <p className="text-base font-extrabold uppercase">Penilaian Ekstrakurikuler {d.ekskul.nama}</p>
          <p className="text-xs">
            Tahun Ajaran {d.ekskul.tahun_ajaran} · Semester {d.ekskul.semester === 'ganjil' ? 'Ganjil' : 'Genap'} · Pembina: {d.ekskul.pembina ?? '-'}
          </p>
        </div>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              {['No', 'Nama', 'NIS', 'Rombel', ...d.aspek, 'Nilai', 'Predikat', 'Deskripsi Perkembangan'].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.data.map((b, i) => (
              <tr key={b.siswa_id} style={{ breakInside: 'avoid' }}>
                <td className="border border-black px-1.5 py-0.5">{i + 1}</td>
                <td className="border border-black px-1.5 py-0.5">{b.nama}</td>
                <td className="border border-black px-1.5 py-0.5">{b.nis}</td>
                <td className="border border-black px-1.5 py-0.5">{b.rombel ?? '-'}</td>
                {d.aspek.map((a) => (
                  <td key={a} className="border border-black px-1.5 py-0.5 text-right">
                    {b.aspek[a] ?? '-'}
                  </td>
                ))}
                <td className="border border-black px-1.5 py-0.5 text-right font-semibold">{b.nilai ?? '-'}</td>
                <td className="border border-black px-1.5 py-0.5 text-center font-semibold">{b.predikat ?? '-'}</td>
                <td className="border border-black px-1.5 py-0.5">{b.deskripsi ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[9px] text-gray-600 mt-2">Predikat: {opsi.skala_predikat.map((s) => `${s[0]} (${s[1]}) ${s[2]}`).join(' · ')}</p>
        <div className="grid grid-cols-2 gap-8 mt-10 text-center" style={{ breakInside: 'avoid' }}>
          <div>
            <p>Mengetahui,</p>
            <p>Waka Kesiswaan</p>
            <div className="h-16" />
            <p>(............................................)</p>
          </div>
          <div>
            <p>&nbsp;</p>
            <p>Pembina Ekstrakurikuler</p>
            <div className="h-16" />
            <p>({d.ekskul.pembina ?? '............................................'})</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EkskulPenilaianTab({ opsi, daftarEkskul, onBerubah }) {
  const [ekskulId, setEkskulId] = useState('')
  const [d, setD] = useState(null)
  const [edit, setEdit] = useState({})
  const [cari, setCari] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [riwayat, setRiwayat] = useState(null)
  const [cetak, setCetak] = useState(false)
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(
    (id = ekskulId) =>
      id
        ? api
            .ekskulPenilaian({ ekskul_id: id, ...(cari ? { search: cari } : {}) })
            .then((r) => {
              setD(r)
              setEdit({})
              setError('')
            })
            .catch((e) => setError(e.message))
        : Promise.resolve(),
    [ekskulId, cari],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  const nilaiBaris = (b) => edit[b.siswa_id]?.aspek ?? b.aspek
  const set = (b, aspek, v) => setEdit((x) => ({ ...x, [b.siswa_id]: { aspek: { ...nilaiBaris(b), [aspek]: v }, deskripsi: x[b.siswa_id]?.deskripsi ?? b.deskripsi ?? '' } }))
  const setDeskripsi = (b, v) => setEdit((x) => ({ ...x, [b.siswa_id]: { aspek: x[b.siswa_id]?.aspek ?? b.aspek, deskripsi: v } }))
  const jumlahUbah = Object.keys(edit).length

  async function aksi(fn, label) {
    setSibuk(true)
    setError('')
    setInfo('')
    try {
      const r = await fn()
      const gagal = r?.gagal?.length ? ` Belum lengkap: ${r.gagal.map((g) => `${g.siswa} (${g.alasan})`).join('; ')}` : ''
      const lewat = r?.dilewati?.length ? ` Dilewati: ${r.dilewati.map((g) => `${g.siswa} (${g.alasan})`).join('; ')}` : ''
      setInfo((r?.message ?? label) + gagal + lewat)
      await muat()
      onBerubah?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
    }
  }

  const simpanSemua = () =>
    aksi(
      () =>
        api.ekskulSimpanPenilaian({
          ekskul_id: Number(ekskulId),
          data: Object.entries(edit).map(([id, v]) => ({
            siswa_id: Number(id),
            aspek: Object.fromEntries(Object.entries(v.aspek).map(([k, val]) => [k, val === '' ? null : Number(val)])),
            deskripsi: v.deskripsi || null,
          })),
        }),
      'Nilai disimpan.',
    )

  const isiKehadiran = () => {
    if (!d.aspek.includes('Kehadiran')) return
    setEdit((x) => {
      const n = { ...x }
      d.data.forEach((b) => {
        if (b.status !== 'terkunci' && b.persen_hadir !== null) n[b.siswa_id] = { aspek: { ...(n[b.siswa_id]?.aspek ?? b.aspek), Kehadiran: b.persen_hadir }, deskripsi: n[b.siswa_id]?.deskripsi ?? b.deskripsi ?? '' }
      })
      return n
    })
  }

  return (
    <div className="space-y-4">
      <Pesan error={error} info={info} />
      <div className="flex items-center gap-2 flex-wrap">
        <select value={ekskulId} onChange={(e) => { setEkskulId(e.target.value); setD(null) }} className={selectClass}>
          <option value="">Pilih ekstrakurikuler</option>
          {daftarEkskul.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
            </option>
          ))}
        </select>
        {d && <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari siswa…" className={`${selectClass} w-44`} />}
        <span className="flex-1" />
        {d && (
          <>
            <Btn onClick={() => api.ekskulExportPenilaian(ekskulId, d.ekskul.nama.replace(/[^A-Za-z0-9]+/g, '-')).catch((e) => setError(e.message))}>Export Excel</Btn>
            <Btn onClick={() => setCetak(true)}>Cetak</Btn>
            <Btn onClick={async () => setRiwayat(await api.ekskulRiwayatPenilaian({ ekskul_id: ekskulId }).catch((e) => (setError(e.message), [])))}>Riwayat Perubahan</Btn>
          </>
        )}
      </div>

      {!d ? (
        <Kosong>Pilih ekstrakurikuler untuk menilai peserta.</Kosong>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Kartu label="Peserta" nilai={d.ringkasan.peserta} tone="biru" />
            <Kartu label="Belum Dinilai" nilai={d.ringkasan.belum} tone="oranye" />
            <Kartu label="Draft" nilai={d.ringkasan.draft} tone="ungu" />
            <Kartu label="Tervalidasi" nilai={d.ringkasan.tervalidasi} tone="teal" />
            <Kartu label="Terkunci" nilai={d.ringkasan.terkunci} tone="hijau" />
            <Kartu label="Rata-rata" nilai={d.ringkasan.rata_rata ?? '-'} sub={Object.entries(d.ringkasan.distribusi).map(([k, v]) => `${k}:${v}`).join(' ')} tone="hijau" />
          </div>

          <p className="text-xs text-navy/50">
            Aspek yang dinilai: <span className="font-semibold text-navy">{d.aspek.join(', ')}</span> (ubah di Daftar Ekstrakurikuler). Nilai 0–100; nilai akhir = rata-rata aspek. Predikat: {opsi.skala_predikat.map((s) => `${s[0]} ${s[2]}`).join(' · ')}.
          </p>

          <div className="flex gap-2 flex-wrap">
            <Btn utama disabled={jumlahUbah === 0 || sibuk} onClick={simpanSemua}>
              Simpan Perubahan ({jumlahUbah})
            </Btn>
            {d.aspek.includes('Kehadiran') && <Btn onClick={isiKehadiran}>Isi Aspek Kehadiran dari Presensi</Btn>}
            <Btn disabled={sibuk || d.ringkasan.draft === 0 || jumlahUbah > 0} title={jumlahUbah ? 'Simpan perubahan terlebih dahulu' : ''} onClick={() => aksi(() => api.ekskulValidasiPenilaian({ ekskul_id: Number(ekskulId) }), 'Validasi selesai.')}>
              Validasi Nilai
            </Btn>
            <Btn disabled={sibuk || d.ringkasan.tervalidasi === 0} onClick={() => window.confirm('Kunci semua nilai yang sudah tervalidasi? Nilai terkunci tidak dapat diubah.') && aksi(() => api.ekskulKunciPenilaian({ ekskul_id: Number(ekskulId) }), 'Nilai dikunci.')}>
              Kunci Nilai
            </Btn>
            <Btn
              bahaya
              disabled={sibuk || d.ringkasan.terkunci === 0}
              onClick={() => {
                const alasan = window.prompt('Alasan membuka kunci nilai (wajib):')
                if (alasan) aksi(() => api.ekskulBukaKunciPenilaian({ ekskul_id: Number(ekskulId), alasan }), 'Kunci dibuka.')
              }}
            >
              Buka Kunci
            </Btn>
          </div>

          <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                  <th className="px-3 py-2 font-semibold">Siswa</th>
                  <th className="px-3 py-2 font-semibold">% Hadir</th>
                  {d.aspek.map((a) => (
                    <th key={a} className="px-3 py-2 font-semibold whitespace-nowrap">
                      {a}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold">Nilai</th>
                  <th className="px-3 py-2 font-semibold">Deskripsi Perkembangan</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {d.data.length === 0 && (
                  <tr>
                    <td colSpan={5 + d.aspek.length} className="px-3 py-8 text-center text-xs text-navy/40">
                      Belum ada peserta pada ekstrakurikuler ini.
                    </td>
                  </tr>
                )}
                {d.data.map((b) => {
                  const kunci = b.status === 'terkunci'
                  const aspek = nilaiBaris(b)
                  const nilai = edit[b.siswa_id] ? rataAspek(aspek) : b.nilai
                  const pred = edit[b.siswa_id] ? predikatDari(nilai) : b.predikat
                  const deskripsi = edit[b.siswa_id]?.deskripsi ?? b.deskripsi ?? ''
                  return (
                    <tr key={b.siswa_id} className={`align-top ${edit[b.siswa_id] ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-navy">{b.nama}</p>
                        <p className="text-[11px] text-navy/40">
                          {b.nis} · {b.rombel ?? '-'}
                          {b.keanggotaan !== 'aktif' ? ` · ${b.keanggotaan}` : ''}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs">{b.persen_hadir === null ? '-' : `${b.persen_hadir}%`}</td>
                      {d.aspek.map((a) => (
                        <td key={a} className="px-3 py-2">
                          <input type="number" min="0" max="100" step="any" disabled={kunci} value={aspek[a] ?? ''} onChange={(e) => set(b, a, e.target.value)} className="w-16 border border-navy/15 rounded-lg px-2 py-1 text-sm text-right disabled:bg-navy/5" />
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-bold text-navy">{nilai ?? '-'}</span> {pred && <Badge tone={TONE_PREDIKAT[pred]}>{pred}</Badge>}
                      </td>
                      <td className="px-3 py-2 min-w-56">
                        <textarea rows={2} disabled={kunci} value={deskripsi} onChange={(e) => setDeskripsi(b, e.target.value)} className="w-full border border-navy/15 rounded-lg px-2 py-1 text-xs disabled:bg-navy/5" />
                        {!kunci && (
                          <button onClick={() => setDeskripsi(b, saranDeskripsi(b.nama, aspek, pred))} className="text-[10px] font-semibold text-navy-light hover:underline">
                            Buat saran deskripsi
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={TONE_NILAI[b.status]}>{b.status_label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {riwayat && (
        <ModalShell title="Riwayat Perubahan Nilai" onClose={() => setRiwayat(null)} lebar="max-w-2xl">
          <RiwayatList items={riwayat} />
        </ModalShell>
      )}
      {cetak && d && <Cetak d={d} opsi={opsi} onClose={() => setCetak(false)} />}
    </div>
  )
}
