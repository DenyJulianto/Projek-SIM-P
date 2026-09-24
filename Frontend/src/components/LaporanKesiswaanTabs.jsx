import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import LaporanPrint from './LaporanPrint'
import LaporanTampilan from './LaporanTampilan'
import { Badge, Btn, Field, Kartu, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { selectClass, tgl, waktu } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'
const FORMAT = { xlsx: 'Excel', pdf: 'PDF', cetak: 'Cetak' }
const TONE_FORMAT = { xlsx: 'hijau', pdf: 'merah', cetak: 'biru' }
const JUDUL_LAPORAN = [
  ['siswa', 'Data Siswa'],
  ['ppdb', 'PPDB'],
  ['kelas', 'Kelas & Rombel'],
  ['mutasi', 'Mutasi Siswa'],
  ['kehadiran', 'Kehadiran'],
  ['perkembangan', 'Perkembangan Siswa'],
]

// ---------------------------------------------------------------- dashboard

export function DashboardLaporan({ filter, onBuka, versi }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!filter.tahun_ajaran_id) return
    let batal = false
    api
      .lkDashboard({ tahun_ajaran_id: filter.tahun_ajaran_id, ...(filter.semester ? { semester: filter.semester } : {}) })
      .then((r) => !batal && (setD(r), setError('')))
      .catch((e) => !batal && setError(e.message))
    return () => {
      batal = true
    }
  }, [filter.tahun_ajaran_id, filter.semester, versi])

  if (error) return <Pesan error={error} />
  if (!d) return <Kosong>Memuat ringkasan…</Kosong>
  const maks = Math.max(1, ...d.per_jenjang.map((j) => j.siswa))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kartu label="Siswa Aktif" nilai={d.siswa_aktif.toLocaleString('id-ID')} sub="seluruh sekolah" tone="hijau" />
        <Kartu label="Siswa Baru" nilai={d.siswa_baru.toLocaleString('id-ID')} sub={`tahun masuk ${d.tahun_masuk_acuan}`} tone="biru" />
        <Kartu label="Siswa Keluar" nilai={d.siswa_keluar.toLocaleString('id-ID')} sub="berstatus keluar/pindah" tone="oranye" />
        <Kartu label="Pindahan Masuk" nilai={d.pindahan_masuk.toLocaleString('id-ID')} sub="tercatat di Mutasi (periode ini)" tone="ungu" />
        <Kartu label="Total Rombel" nilai={d.rombel} sub={d.konteks.tahun_ajaran} tone="teal" />
        <Kartu label="Kehadiran" nilai={d.kehadiran === null ? '-' : `${d.kehadiran}%`} sub={d.konteks.periode} tone="hijau" />
        <Kartu label="Laporan Dibuat" nilai={d.jumlah_laporan} sub={`${d.laporan_bulan_ini} bulan ini`} tone="biru" />
        <div className="rounded-2xl border border-navy/10 bg-white p-4">
          <p className="text-xs text-navy/60">Buat Laporan</p>
          <button onClick={() => onBuka('siswa')} className="text-sm font-semibold text-navy-light hover:underline mt-1.5">
            Laporan Data Siswa →
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-navy/5 shadow-sm p-5">
          <h3 className="text-sm font-bold text-navy mb-3">Siswa Aktif per Jenjang</h3>
          {d.per_jenjang.length === 0 ? (
            <Kosong>Belum ada rombel pada tahun ajaran ini.</Kosong>
          ) : (
            <div className="space-y-2.5">
              {d.per_jenjang.map((j) => (
                <div key={j.jenjang}>
                  <div className="flex justify-between text-xs text-navy/70 mb-0.5">
                    <span>
                      {j.jenjang} <span className="text-navy/40">({j.rombel} rombel)</span>
                    </span>
                    <span className="font-semibold text-navy">{j.siswa}</span>
                  </div>
                  <div className="h-2 bg-navy/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(j.siswa / maks) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {d.per_tingkat.length > 0 && (
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-[11px] uppercase text-navy/50 text-left">
                  <th className="py-1">Tingkat</th>
                  <th className="py-1 text-right">Rombel</th>
                  <th className="py-1 text-right">Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {d.per_tingkat.map((t) => (
                  <tr key={t.tingkat}>
                    <td className="py-1.5">{t.tingkat}</td>
                    <td className="py-1.5 text-right">{t.rombel}</td>
                    <td className="py-1.5 text-right font-semibold">{t.siswa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-navy/5 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-navy">Laporan Terbaru</h3>
            <button onClick={() => onBuka('arsip')} className="text-xs font-semibold text-navy-light hover:underline">
              Lihat semua
            </button>
          </div>
          {d.terbaru.length === 0 ? (
            <Kosong>Belum ada laporan yang dibuat.</Kosong>
          ) : (
            <div className="divide-y divide-navy/5">
              {d.terbaru.map((a) => (
                <div key={a.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{a.nama}</p>
                    <p className="text-[11px] text-navy/40">
                      {waktu(a.created_at)} · {a.pembuat ?? '-'}
                    </p>
                  </div>
                  <Badge tone={TONE_FORMAT[a.format]}>{FORMAT[a.format]}</Badge>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs font-bold text-navy mt-4 mb-2">Buat laporan</p>
          <div className="flex flex-wrap gap-2">
            {JUDUL_LAPORAN.map(([k, l]) => (
              <Btn key={k} kecil onClick={() => onBuka(k)}>
                {l}
              </Btn>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// --------------------------------------------------------------------- arsip

export function ArsipLaporan({ opsi, versi, onBerubah }) {
  const [f, setF] = useState({ jenis: '', format: '', tahun_ajaran_id: '', dari: '', sampai: '', search: '' })
  const [halaman, setHalaman] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [lihat, setLihat] = useState(null)
  const [cetak, setCetak] = useState(null)

  const muat = useCallback(
    () =>
      api
        .lkArsip({ page: halaman, per_page: 15, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) })
        .then((r) => {
          setData(r)
          setError('')
        })
        .catch((e) => setError(e.message)),
    [f, halaman],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat, versi])

  const set = (k, v) => {
    setHalaman(1)
    setF((x) => ({ ...x, [k]: v }))
  }

  async function buka(a, aksi) {
    setError('')
    try {
      const laporan = await api.lkBukaArsip(a.id)
      if (aksi === 'lihat') setLihat({ a, laporan })
      else setCetak(laporan)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-navy/50">Setiap laporan yang diexport atau dicetak disimpan sebagai arsip dengan isi persis seperti saat dibuat. Download ulang dan cetak ulang memakai isi arsip tersebut, bukan data terbaru.</p>
      <Pesan error={error} info={info} />
      <div className="flex items-center gap-2 flex-wrap">
        <input value={f.search} onChange={(e) => set('search', e.target.value)} placeholder="Cari nama laporan…" className={`${selectClass} w-52`} />
        <select value={f.jenis} onChange={(e) => set('jenis', e.target.value)} className={selectClass}>
          <option value="">Semua jenis</option>
          {opsi.jenis.map((j) => (
            <option key={j.key} value={j.key}>
              {j.label}
            </option>
          ))}
        </select>
        <select value={f.format} onChange={(e) => set('format', e.target.value)} className={selectClass}>
          <option value="">Semua format</option>
          {Object.entries(FORMAT).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select value={f.tahun_ajaran_id} onChange={(e) => set('tahun_ajaran_id', e.target.value)} className={selectClass}>
          <option value="">Semua tahun ajaran</option>
          {opsi.tahun_ajaran.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Dibuat dari <input type="date" value={f.dari} onChange={(e) => set('dari', e.target.value)} className={selectClass} />
        </label>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          sampai <input type="date" value={f.sampai} onChange={(e) => set('sampai', e.target.value)} className={selectClass} />
        </label>
      </div>

      {!data ? (
        <Kosong>Memuat arsip…</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['Nama Laporan', 'Jenis', 'Periode / TA', 'Pembuat', 'Tanggal Dibuat', 'Format', 'Status', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-navy/40">
                    Belum ada arsip laporan yang sesuai.
                  </td>
                </tr>
              )}
              {data.data.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="px-3 py-2 font-semibold text-navy max-w-64">{a.nama}</td>
                  <td className="px-3 py-2 text-xs">{a.jenis_label}</td>
                  <td className="px-3 py-2 text-xs text-navy/60">
                    {a.periode}
                    <p>TA {a.tahun_ajaran}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{a.pembuat ?? '-'}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{waktu(a.created_at)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={TONE_FORMAT[a.format]}>{FORMAT[a.format]}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={a.status === 'tersedia' ? 'hijau' : 'merah'}>{a.status_label}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                    <Btn kecil disabled={a.status !== 'tersedia'} onClick={() => buka(a, 'lihat')}>
                      Lihat
                    </Btn>
                    <Btn kecil disabled={a.status !== 'tersedia'} onClick={() => api.lkUnduhArsip(a.id, a.format === 'xlsx' ? 'xlsx' : 'pdf').catch((e) => setError(e.message))}>
                      Download
                    </Btn>
                    <Btn kecil disabled={a.status !== 'tersedia'} onClick={() => buka(a, 'cetak')}>
                      Cetak Ulang
                    </Btn>
                    <Btn
                      kecil
                      bahaya
                      onClick={async () => {
                        if (!window.confirm(`Hapus arsip "${a.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return
                        try {
                          await api.lkHapusArsip(a.id)
                          setInfo('Arsip dihapus.')
                          muat()
                          onBerubah?.()
                        } catch (e) {
                          setError(e.message)
                        }
                      }}
                    >
                      Hapus
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-3 py-2 border-t border-navy/5 text-xs text-navy/50">
            <span>
              {data.total} arsip · Hapus: {opsi.boleh_hapus_arsip ? 'semua arsip' : 'hanya arsip yang Anda buat'}
            </span>
            <div className="flex items-center gap-2">
              <Btn kecil disabled={data.current_page <= 1} onClick={() => setHalaman((h) => h - 1)}>
                ‹
              </Btn>
              <span>
                {data.current_page} / {data.last_page}
              </span>
              <Btn kecil disabled={data.current_page >= data.last_page} onClick={() => setHalaman((h) => h + 1)}>
                ›
              </Btn>
            </div>
          </div>
        </div>
      )}

      {lihat && (
        <ModalShell
          title={lihat.a.nama}
          onClose={() => setLihat(null)}
          lebar="max-w-6xl"
          footer={
            <>
              <Btn onClick={() => api.lkUnduhArsip(lihat.a.id, 'xlsx').catch((e) => setError(e.message))}>Download Excel</Btn>
              <Btn onClick={() => api.lkUnduhArsip(lihat.a.id, 'pdf').catch((e) => setError(e.message))}>Download PDF</Btn>
              <Btn utama onClick={() => { setCetak(lihat.laporan); setLihat(null) }}>
                Cetak Ulang
              </Btn>
            </>
          }
        >
          <p className="text-xs text-navy/50 mb-3">
            Arsip dibuat {waktu(lihat.a.created_at)} oleh {lihat.a.pembuat ?? '-'}. Isi di bawah adalah isi saat dibuat.
          </p>
          <LaporanTampilan laporan={lihat.laporan} />
        </ModalShell>
      )}
      {cetak && <LaporanPrint laporan={cetak} onClose={() => setCetak(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------- pengaturan

export function PengaturanKop({ onTersimpan }) {
  const [f, setF] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    api.lkPengaturan().then(setF).catch((e) => setError(e.message))
  }, [])
  if (!f) return <Kosong>{error || 'Memuat…'}</Kosong>

  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const ubahTtd = (i, k, v) => setF((x) => ({ ...x, penandatangan: x.penandatangan.map((t, n) => (n === i ? { ...t, [k]: v } : t)) }))

  async function simpan(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    try {
      const r = await api.lkSimpanPengaturan({
        kop_nama: f.kop_nama, kop_alamat: f.kop_alamat || null, kop_kontak: f.kop_kontak || null, tampil_logo: f.tampil_logo, kota: f.kota || null,
        penandatangan: f.penandatangan.map((t) => ({ jabatan: t.jabatan, nama: t.nama || null, nip: t.nip || null })),
      })
      setF((x) => ({ ...x, ...r }))
      setInfo('Pengaturan disimpan dan dipakai pada semua laporan berikutnya.')
      onTersimpan?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={simpan} className="bg-white border border-navy/10 rounded-2xl p-5 space-y-4 max-w-3xl">
      <p className="text-xs text-navy/50">Berlaku untuk semua laporan kesiswaan (preview, PDF, Excel, dan cetak) serta surat mutasi. Tanggal laporan, urutan, dan kolom diatur pada tiap laporan.</p>
      <Pesan error={error} info={info} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nama sekolah pada kop" className="sm:col-span-2">
          <input required value={f.kop_nama} onChange={(e) => u('kop_nama', e.target.value)} className={input} />
        </Field>
        <Field label="Alamat" className="sm:col-span-2">
          <input value={f.kop_alamat ?? ''} onChange={(e) => u('kop_alamat', e.target.value)} className={input} />
        </Field>
        <Field label="Kontak (telepon/email)">
          <input value={f.kop_kontak ?? ''} onChange={(e) => u('kop_kontak', e.target.value)} className={input} />
        </Field>
        <Field label="Kota (untuk tempat penandatanganan)">
          <input value={f.kota ?? ''} onChange={(e) => u('kota', e.target.value)} className={input} />
        </Field>
      </div>
      <div className="flex items-center gap-4">
        {f.logo_sekolah ? <img src={f.logo_sekolah} alt="Logo sekolah" className="h-14 w-14 object-contain border border-navy/10 rounded-lg" /> : <span className="h-14 w-14 rounded-lg bg-navy/5 flex items-center justify-center text-[10px] text-navy/40 text-center">Belum ada logo</span>}
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" checked={f.tampil_logo} onChange={(e) => u('tampil_logo', e.target.checked)} /> Tampilkan logo sekolah pada kop
        </label>
        <p className="text-[11px] text-navy/40">Logo diambil dari Profil Sekolah. Pada PDF, logo hanya tampil bila berkas logo tersimpan di server.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-navy">Penandatangan (maks. 3)</p>
          {f.penandatangan.length < 3 && (
            <Btn kecil onClick={() => u('penandatangan', [...f.penandatangan, { jabatan: '', nama: '', nip: '' }])}>
              + Penandatangan
            </Btn>
          )}
        </div>
        <div className="space-y-2">
          {f.penandatangan.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_140px_auto] gap-2 items-end">
              <Field label={i === 0 ? 'Jabatan' : ''}>
                <input required value={t.jabatan} onChange={(e) => ubahTtd(i, 'jabatan', e.target.value)} className={input} />
              </Field>
              <Field label={i === 0 ? 'Nama pejabat' : ''}>
                <input value={t.nama ?? ''} onChange={(e) => ubahTtd(i, 'nama', e.target.value)} className={input} />
              </Field>
              <Field label={i === 0 ? 'NIP' : ''}>
                <input value={t.nip ?? ''} onChange={(e) => ubahTtd(i, 'nip', e.target.value)} className={input} />
              </Field>
              <Btn kecil bahaya onClick={() => u('penandatangan', f.penandatangan.filter((_, n) => n !== i))}>
                Hapus
              </Btn>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Btn type="submit" utama>
          Simpan Pengaturan
        </Btn>
      </div>
    </form>
  )
}

// ------------------------------------------------------------- pemilih siswa

export function PemilihSiswa({ terpilih, onPilih }) {
  const [cari, setCari] = useState('')
  const [hasil, setHasil] = useState([])

  useEffect(() => {
    if (cari.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasil([])
      return
    }
    const t = setTimeout(() => api.lkCariSiswa(cari.trim()).then(setHasil).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [cari])

  return (
    <div className="relative w-72">
      {terpilih ? (
        <div className="flex items-center justify-between gap-2 border border-navy/15 rounded-lg px-3 py-2 bg-white text-sm">
          <span className="truncate">
            <span className="font-semibold text-navy">{terpilih.nama}</span> <span className="text-navy/40">{terpilih.nis}</span>
          </span>
          <button onClick={() => onPilih(null)} className="text-navy/40 hover:text-navy" aria-label="Ganti siswa">
            ×
          </button>
        </div>
      ) : (
        <>
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama / NIS / NISN siswa…" className={input} />
          {hasil.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-navy/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {hasil.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onPilih(s)
                    setCari('')
                    setHasil([])
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-navy/5"
                >
                  <span className="font-semibold text-navy">{s.nama}</span>
                  <span className="block text-[11px] text-navy/50">
                    {s.nis} · {s.kelas ?? 'tanpa rombel'} · {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// -------------------------------------------------------------------- mutasi

export function FormMutasi({ onClose, onSaved, jenisAwal = 'keluar' }) {
  const [siswa, setSiswa] = useState(null)
  const [f, setF] = useState({ jenis: jenisAwal, tanggal: new Date().toISOString().slice(0, 10), asal_sekolah: '', tujuan_sekolah: '', alasan: '', keterangan: '', terapkan_status: false })
  const [error, setError] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))

  async function kirim() {
    setSibuk(true)
    setError('')
    try {
      onSaved(await api.lkCatatMutasi({ ...f, siswa_id: siswa.id, ...Object.fromEntries(['asal_sekolah', 'tujuan_sekolah', 'alasan', 'keterangan'].map((k) => [k, f[k] || null])) }))
    } catch (e) {
      setError(e.message)
      setSibuk(false)
    }
  }

  return (
    <ModalShell
      title="Catat Mutasi Siswa"
      onClose={onClose}
      lebar="max-w-xl"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={!siswa || sibuk} onClick={kirim}>
            {sibuk ? 'Menyimpan…' : 'Simpan'}
          </Btn>
        </>
      }
    >
      <Pesan error={error} />
      <p className="text-xs text-navy/50 mb-3">Siswa yang masuk lewat PPDB dan perpindahan rombel tidak perlu dicatat di sini — keduanya otomatis muncul di laporan dari menu PPDB dan Kelas & Rombel.</p>
      <div className="space-y-3">
        <Field label="Siswa">
          <PemilihSiswa terpilih={siswa} onPilih={setSiswa} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Jenis mutasi">
            <select value={f.jenis} onChange={(e) => u('jenis', e.target.value)} className={input}>
              <option value="keluar">Siswa keluar</option>
              <option value="pindah_sekolah">Pindah sekolah</option>
              <option value="masuk">Siswa masuk (pindahan)</option>
            </select>
          </Field>
          <Field label="Tanggal">
            <input type="date" value={f.tanggal} onChange={(e) => u('tanggal', e.target.value)} className={input} />
          </Field>
          {f.jenis === 'masuk' && (
            <Field label="Asal sekolah" className="sm:col-span-2">
              <input value={f.asal_sekolah} onChange={(e) => u('asal_sekolah', e.target.value)} className={input} />
            </Field>
          )}
          {f.jenis === 'pindah_sekolah' && (
            <Field label="Sekolah tujuan" className="sm:col-span-2">
              <input value={f.tujuan_sekolah} onChange={(e) => u('tujuan_sekolah', e.target.value)} className={input} />
            </Field>
          )}
          <Field label={f.jenis === 'keluar' ? 'Alasan (wajib)' : 'Alasan'} className="sm:col-span-2">
            <input value={f.alasan} onChange={(e) => u('alasan', e.target.value)} className={input} />
          </Field>
          <Field label="Keterangan" className="sm:col-span-2">
            <textarea rows={2} value={f.keterangan} onChange={(e) => u('keterangan', e.target.value)} className={input} />
          </Field>
        </div>
        {f.jenis !== 'masuk' && (
          <label className="flex items-start gap-2 text-sm text-navy">
            <input type="checkbox" className="mt-1" checked={f.terapkan_status} onChange={(e) => u('terapkan_status', e.target.checked)} />
            <span>
              Ubah status siswa di Data Siswa menjadi “{f.jenis === 'keluar' ? 'Keluar' : 'Pindah'}”
              <span className="block text-[11px] text-navy/50">Bila dicentang, siswa tidak lagi dihitung sebagai siswa aktif. Dapat dipulihkan saat membatalkan catatan.</span>
            </span>
          </label>
        )}
      </div>
    </ModalShell>
  )
}

export function RiwayatMutasi({ siswaId, nama, onClose }) {
  const [d, setD] = useState(null)
  useEffect(() => {
    api.lkRiwayatMutasi(siswaId).then(setD).catch(() => setD({ mutasi: [], log: [] }))
  }, [siswaId])
  return (
    <ModalShell title={`Riwayat Mutasi — ${nama}`} onClose={onClose} lebar="max-w-2xl">
      {!d ? (
        <Kosong>Memuat…</Kosong>
      ) : (
        <div className="space-y-5">
          <div className="divide-y divide-navy/5 border border-navy/10 rounded-xl">
            {d.mutasi.length === 0 && <p className="text-xs text-navy/40 text-center py-4">Belum ada catatan mutasi di register.</p>}
            {d.mutasi.map((m) => (
              <div key={m.id} className="px-4 py-2 flex items-center justify-between gap-3 text-sm">
                <span>
                  {tgl(m.tanggal)} · <span className="font-semibold">{m.jenis_label}</span>
                  {m.tujuan_sekolah ? ` → ${m.tujuan_sekolah}` : ''}
                  {m.asal_sekolah ? ` ← ${m.asal_sekolah}` : ''}
                </span>
                <Badge tone={m.status === 'tercatat' ? 'hijau' : 'merah'}>{m.status === 'tercatat' ? 'Tercatat' : 'Dibatalkan'}</Badge>
              </div>
            ))}
          </div>
          <RiwayatList items={d.log} kosong="Belum ada log perubahan." />
        </div>
      )}
    </ModalShell>
  )
}
