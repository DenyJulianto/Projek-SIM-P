import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { LABEL_HADIR, TONE_HADIR } from './ekskulKonstanta'
import { Badge, Btn, Kartu, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { selectClass, tgl } from './ppdbKonstanta'

const STATUS = ['hadir', 'izin', 'sakit', 'alpha']
const WARNA_AKTIF = { hadir: 'bg-emerald-600 text-white', izin: 'bg-sky-600 text-white', sakit: 'bg-amber-500 text-white', alpha: 'bg-red-600 text-white' }

function InputPresensi({ daftarEkskul, kegiatanAwal, onBerubah }) {
  const [ekskulId, setEkskulId] = useState('')
  const [daftarKegiatan, setDaftarKegiatan] = useState([])
  const [kegiatanId, setKegiatanId] = useState(kegiatanAwal ? String(kegiatanAwal) : '')
  const [data, setData] = useState(null)
  const [nilai, setNilai] = useState({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [log, setLog] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    if (!ekskulId) return
    api
      .ekskulKegiatanList({ ekskul_id: ekskulId, waktu: 'lalu' })
      .then(async (lalu) => {
        const hariIni = await api.ekskulKegiatanList({ ekskul_id: ekskulId, dari: new Date().toISOString().slice(0, 10), sampai: new Date().toISOString().slice(0, 10) })
        setDaftarKegiatan([...hariIni, ...lalu].filter((k) => k.status !== 'dibatalkan'))
      })
      .catch((e) => setError(e.message))
  }, [ekskulId])

  const muatPresensi = useCallback(
    (id) =>
      api
        .ekskulPresensi(id)
        .then((r) => {
          setData(r)
          setNilai(Object.fromEntries(r.data.map((x) => [x.siswa_id, { status: x.status, keterangan: x.keterangan ?? '' }])))
          setError('')
        })
        .catch((e) => setError(e.message)),
    [],
  )
  useEffect(() => {
    if (!kegiatanId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muatPresensi(kegiatanId)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLog(null)
  }, [kegiatanId, muatPresensi])

  // Kegiatan yang dibuka dari tab Jadwal: pilih ekskulnya otomatis.
  useEffect(() => {
    if (kegiatanAwal && data && !ekskulId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEkskulId(String(data.kegiatan.ekskul.id))
    }
  }, [kegiatanAwal, data, ekskulId])

  const set = (id, k, v) => setNilai((n) => ({ ...n, [id]: { ...n[id], [k]: v } }))

  async function simpan(semuaHadir = false) {
    setSibuk(true)
    setError('')
    setInfo('')
    try {
      const payload = semuaHadir ? { semua_hadir: true } : { data: Object.entries(nilai).filter(([, v]) => v.status).map(([id, v]) => ({ siswa_id: Number(id), status: v.status, keterangan: v.keterangan || null })) }
      const r = await api.ekskulSimpanPresensi(kegiatanId, payload)
      setInfo(r.message)
      await muatPresensi(kegiatanId)
      onBerubah?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
    }
  }

  const hitung = STATUS.map((s) => [s, Object.values(nilai).filter((v) => v.status === s).length])
  const belumIsi = Object.values(nilai).filter((v) => !v.status).length

  return (
    <div className="space-y-4">
      <Pesan error={error} info={info} />
      <div className="flex items-center gap-2 flex-wrap">
        <select value={ekskulId} onChange={(e) => { setEkskulId(e.target.value); setKegiatanId(''); setData(null) }} className={selectClass}>
          <option value="">Pilih ekstrakurikuler</option>
          {daftarEkskul.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
            </option>
          ))}
        </select>
        <select value={kegiatanId} onChange={(e) => setKegiatanId(e.target.value)} disabled={!ekskulId} className={`${selectClass} min-w-64`}>
          <option value="">Pilih kegiatan</option>
          {daftarKegiatan.map((k) => (
            <option key={k.id} value={k.id}>
              {tgl(k.tanggal)} · {k.jam_mulai} · {k.materi || k.jenis_label} {k.presensi_tercatat ? `(✓ ${k.presensi_tercatat})` : ''}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-navy/40">Presensi hanya untuk kegiatan yang tanggalnya sudah tiba.</p>
      </div>

      {!data ? (
        <Kosong>Pilih ekstrakurikuler dan kegiatan untuk mengisi presensi.</Kosong>
      ) : (
        <>
          <div className="bg-white border border-navy/10 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-navy">{data.kegiatan.ekskul.nama}</p>
              <p className="text-xs text-navy/60">
                {data.kegiatan.hari}, {tgl(data.kegiatan.tanggal)} · {data.kegiatan.jam_mulai}–{data.kegiatan.jam_selesai}
                {data.kegiatan.materi ? ` · ${data.kegiatan.materi}` : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {hitung.map(([s, n]) => (
                <span key={s} className="text-xs">
                  <Badge tone={TONE_HADIR[s]}>
                    {LABEL_HADIR[s]}: {n}
                  </Badge>
                </span>
              ))}
              <Badge tone="abu">Belum diisi: {belumIsi}</Badge>
            </div>
          </div>
          {!data.boleh_input && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">{data.alasan_terkunci}</p>}

          <div className="flex gap-2 flex-wrap">
            <Btn disabled={!data.boleh_input || sibuk || belumIsi === 0} onClick={() => simpan(true)}>
              Tandai Seluruh Peserta Hadir
            </Btn>
            <Btn utama disabled={!data.boleh_input || sibuk} onClick={() => simpan(false)}>
              {sibuk ? 'Menyimpan…' : 'Simpan Presensi'}
            </Btn>
            <span className="flex-1" />
            <Btn
              onClick={async () => {
                setLog(log ? null : (await api.ekskulRiwayatPresensi({ kegiatan_id: kegiatanId }).catch((e) => (setError(e.message), { log: [] }))).log)
              }}
            >
              {log ? 'Sembunyikan Riwayat' : 'Riwayat Presensi'}
            </Btn>
          </div>

          <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                  {['Siswa', 'Kelas', 'Status Kehadiran', 'Keterangan'].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-navy/40">
                      Belum ada peserta yang tercatat pada tanggal kegiatan ini.
                    </td>
                  </tr>
                )}
                {data.data.map((s) => (
                  <tr key={s.siswa_id}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-navy">{s.nama}</p>
                      <p className="text-[11px] text-navy/40">{s.nis}</p>
                    </td>
                    <td className="px-3 py-2">{s.kelas ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {STATUS.map((st) => (
                          <button
                            key={st}
                            disabled={!data.boleh_input}
                            onClick={() => set(s.siswa_id, 'status', st)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border disabled:opacity-50 ${nilai[s.siswa_id]?.status === st ? `${WARNA_AKTIF[st]} border-transparent` : 'border-navy/15 text-navy/60 hover:bg-navy/5'}`}
                          >
                            {LABEL_HADIR[st]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input disabled={!data.boleh_input} value={nilai[s.siswa_id]?.keterangan ?? ''} onChange={(e) => set(s.siswa_id, 'keterangan', e.target.value)} placeholder="Opsional" className="border border-navy/15 rounded-lg px-2 py-1 text-xs w-48 disabled:bg-navy/5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {log && (
            <section className="bg-white border border-navy/10 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-navy mb-3">Riwayat Presensi Kegiatan Ini</h3>
              <RiwayatList items={log} kosong="Belum ada presensi tersimpan." />
            </section>
          )}
        </>
      )}
    </div>
  )
}

function RekapKehadiran({ filter, daftarEkskul }) {
  const [f, setF] = useState({ ekskul_id: '', kelas_id: '', search: '', dari: '', sampai: '' })
  const [kelas, setKelas] = useState([])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [riwayat, setRiwayat] = useState(null)

  const params = Object.fromEntries(Object.entries({ tahun_ajaran_id: filter.tahun_ajaran_id, semester: filter.semester, ...f }).filter(([, v]) => v))
  useEffect(() => {
    api.listKelasAll().then((r) => setKelas(r.data ?? r)).catch(() => {})
  }, [])
  useEffect(() => {
    let batal = false
    api
      .ekskulRekapKehadiran(params)
      .then((r) => !batal && (setData(r), setError('')))
      .catch((e) => !batal && setError(e.message))
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return (
    <div className="space-y-4">
      <Pesan error={error} />
      <div className="flex items-center gap-2 flex-wrap">
        <input value={f.search} onChange={(e) => setF((x) => ({ ...x, search: e.target.value }))} placeholder="Cari siswa…" className={`${selectClass} w-44`} />
        <select value={f.ekskul_id} onChange={(e) => setF((x) => ({ ...x, ekskul_id: e.target.value }))} className={selectClass}>
          <option value="">Semua ekstrakurikuler</option>
          {daftarEkskul.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama}
            </option>
          ))}
        </select>
        <select value={f.kelas_id} onChange={(e) => setF((x) => ({ ...x, kelas_id: e.target.value }))} className={selectClass}>
          <option value="">Semua kelas/rombel</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Dari <input type="date" value={f.dari} onChange={(e) => setF((x) => ({ ...x, dari: e.target.value }))} className={selectClass} />
        </label>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Sampai <input type="date" value={f.sampai} onChange={(e) => setF((x) => ({ ...x, sampai: e.target.value }))} className={selectClass} />
        </label>
        <span className="flex-1" />
        <Btn onClick={() => api.ekskulExportKehadiran(params).catch((e) => setError(e.message))}>Export Excel</Btn>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kartu label="Persentase Kehadiran" nilai={data.ringkasan.persen === null ? '-' : `${data.ringkasan.persen}%`} tone="hijau" />
          <Kartu label="Siswa Tercatat" nilai={data.ringkasan.siswa} tone="biru" />
          <Kartu label="Catatan Presensi" nilai={data.ringkasan.catatan} tone="ungu" />
          <Kartu label="Hadir" nilai={data.ringkasan.hadir} tone="teal" />
        </div>
      )}

      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['Ekstrakurikuler', 'Siswa', 'Rombel', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total', '% Hadir', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.baris.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-xs text-navy/40">
                    Belum ada presensi tercatat pada filter ini.
                  </td>
                </tr>
              )}
              {data.baris.map((b) => (
                <tr key={`${b.ekskul_id}-${b.siswa_id}`}>
                  <td className="px-3 py-2">{b.ekskul}</td>
                  <td className="px-3 py-2 font-semibold text-navy">{b.nama}</td>
                  <td className="px-3 py-2">{b.rombel ?? '-'}</td>
                  <td className="px-3 py-2">{b.hadir}</td>
                  <td className="px-3 py-2">{b.izin}</td>
                  <td className="px-3 py-2">{b.sakit}</td>
                  <td className="px-3 py-2">{b.alpha}</td>
                  <td className="px-3 py-2">{b.total}</td>
                  <td className="px-3 py-2 min-w-28">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-navy/10 rounded-full overflow-hidden">
                        <div className={`h-full ${b.persen >= 80 ? 'bg-emerald-500' : b.persen >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${b.persen}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{b.persen}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Btn kecil onClick={async () => setRiwayat({ nama: b.nama, ...(await api.ekskulRiwayatPresensi({ siswa_id: b.siswa_id, ekskul_id: b.ekskul_id }).catch((e) => (setError(e.message), { catatan: [] }))) })}>
                      Riwayat
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-navy/40">Persentase = hadir ÷ kegiatan yang presensinya tercatat (kegiatan dibatalkan tidak dihitung).</p>

      {riwayat && (
        <ModalShell title={`Riwayat Presensi — ${riwayat.nama}`} onClose={() => setRiwayat(null)} lebar="max-w-xl">
          <div className="divide-y divide-navy/5">
            {riwayat.catatan.length === 0 && <Kosong>Belum ada catatan.</Kosong>}
            {riwayat.catatan.map((c, i) => (
              <div key={i} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span>
                  {tgl(c.tanggal)} · {c.ekskul}
                  {c.materi ? <span className="text-navy/40"> — {c.materi}</span> : ''}
                </span>
                <span className="flex items-center gap-2">
                  {c.keterangan && <span className="text-[11px] text-navy/40">{c.keterangan}</span>}
                  <Badge tone={TONE_HADIR[c.status]}>{c.status_label}</Badge>
                </span>
              </div>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default function EkskulKehadiranTab({ filter, daftarEkskul, kegiatanAwal, onBerubah }) {
  const [tampil, setTampil] = useState('input')
  return (
    <div>
      <div className="flex rounded-full border border-navy/15 overflow-hidden w-fit mb-4">
        {[
          ['input', 'Input Presensi'],
          ['rekap', 'Rekap Kehadiran'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTampil(k)} className={`px-4 py-1.5 text-sm font-semibold ${tampil === k ? 'bg-navy text-white' : 'text-navy/60 hover:bg-navy/5'}`}>
            {l}
          </button>
        ))}
      </div>
      {tampil === 'input' ? <InputPresensi daftarEkskul={daftarEkskul} kegiatanAwal={kegiatanAwal} onBerubah={onBerubah} /> : <RekapKehadiran filter={filter} daftarEkskul={daftarEkskul} />}
    </div>
  )
}
