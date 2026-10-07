import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import DokumenPerangkatAjar from '../components/DokumenPerangkatAjar'
import EditorTeks from '../components/EditorTeks'
import { api } from '../lib/api'
import {
  atpKosong,
  FIELD,
  formatUkuran,
  kalimatAtp,
  kekurangan,
  KURIKULUM_META,
  LANGKAH,
  labelFase,
  METODE,
  MODA,
  namaFileModul,
  normalisasi,
  pertemuanKosong,
  PROFIL_PELAJAR,
  RUMUS_NILAI_BAWAAN,
  STATUS_META,
  TAHAP,
  TARGET_PESERTA,
  teksPolos,
} from '../lib/perangkatAjar'

const KARTU = 'bg-white rounded-2xl border border-slate-200 shadow-sm'
const INPUT =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500'
const TOMBOL_UTAMA =
  'rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed'
const TOMBOL_KEDUA =
  'rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2.5 disabled:opacity-50'
const JENIS_LAMPIRAN = { lkpd: 'LKPD', rubrik: 'Rubrik Penilaian', bahan_bacaan: 'Bahan Bacaan', lainnya: 'Lainnya' }
const STATUS_FILTER = [
  ['semua', 'Semua'],
  ['draft', 'Draf'],
  ['diajukan', 'Diajukan'],
  ['revisi', 'Perlu Revisi'],
  ['disetujui', 'Disetujui'],
]

function formatTanggal(v, jam) {
  if (!v) return '-'
  return new Date(v).toLocaleString('id-ID', jam ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
}

function bisaDiubah(m) {
  return m.status === 'draft' || m.status === 'revisi'
}

export default function ModulAjarManagement({ onBack }) {
  const [items, setItems] = useState(null)
  const [opsi, setOpsi] = useState(null)
  const [form, setForm] = useState(null)
  const [pilihKurikulum, setPilihKurikulum] = useState(false)
  const [melihat, setMelihat] = useState(null)
  const [hapus, setHapus] = useState(null)
  const [memproses, setMemproses] = useState(false)
  const [filter, setFilter] = useState('semua')
  const [cari, setCari] = useState('')
  const [error, setError] = useState('')

  const muat = useCallback(() => {
    api.listModulAjar().then(setItems).catch((e) => {
      setItems([])
      setError(e.message)
    })
  }, [])

  useEffect(() => {
    muat()
    api.getOpsiModulAjar().then(setOpsi).catch((e) => setError(e.message))
  }, [muat])

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return (items || [])
      .filter((m) => filter === 'semua' || m.status === filter)
      .filter((m) => !q || `${m.judul} ${m.mata_pelajaran || ''} ${m.kelas || ''}`.toLowerCase().includes(q))
  }, [items, filter, cari])

  function buatBaru() {
    // K13 dinonaktifkan Super Admin untuk sekolah ini: langsung Modul Ajar.
    if (opsi && !opsi.k13_aktif) setForm({ kurikulum: 'merdeka' })
    else setPilihKurikulum(true)
  }

  async function konfirmasiHapus() {
    setMemproses(true)
    try {
      await api.deleteModulAjar(hapus.id)
      setHapus(null)
      muat()
    } catch (e) {
      setError(e.message)
    } finally {
      setMemproses(false)
    }
  }

  async function tarik(m) {
    try {
      await api.tarikModulAjar(m.id)
      muat()
    } catch (e) {
      setError(e.message)
    }
  }

  if (form) {
    return (
      <Latar>
        <FormPerangkatAjar
          modul={form.modul}
          kurikulum={form.modul?.kurikulum || form.kurikulum}
          opsi={opsi}
          onTutup={() => {
            setForm(null)
            muat()
          }}
        />
      </Latar>
    )
  }

  return (
    <Latar>
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Perangkat Ajar</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Susun Modul Ajar{opsi?.k13_aktif !== false && ' atau RPP'}, lalu ajukan ke Kepala Sekolah / Waka Kurikulum untuk disetujui.
          </p>
        </div>
        <button onClick={buatBaru} disabled={!opsi} className={TOMBOL_UTAMA}>
          + Buat Perangkat Ajar
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className={`${KARTU} p-3 mb-5 flex flex-wrap items-center gap-2`}>
        {STATUS_FILTER.map(([k, label]) => {
          const n = k === 'semua' ? items?.length : items?.filter((m) => m.status === k).length
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full ${
                filter === k ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
              {n > 0 && <span className={`ml-1.5 text-xs ${filter === k ? 'text-white/80' : 'text-slate-400'}`}>{n}</span>}
            </button>
          )
        })}
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari judul, mapel, kelas..."
          className={`${INPUT} sm:ml-auto sm:w-72 rounded-full`}
        />
      </div>

      {items === null && <p className="text-sm text-slate-400">Memuat...</p>}
      {items?.length === 0 && (
        <div className={`${KARTU} p-10 text-center`}>
          <p className="font-semibold text-slate-700">Belum ada perangkat ajar.</p>
          <p className="text-sm text-slate-500 mt-1">Klik &ldquo;Buat Perangkat Ajar&rdquo; untuk memulai.</p>
        </div>
      )}
      {items?.length > 0 && tampil.length === 0 && <p className="text-sm text-slate-500">Tidak ada perangkat ajar yang cocok.</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tampil.map((m) => (
          <KartuModul
            key={m.id}
            modul={m}
            onLihat={() => setMelihat(m)}
            onEdit={() => setForm({ modul: m })}
            onHapus={() => setHapus(m)}
            onTarik={() => tarik(m)}
          />
        ))}
      </div>

      {pilihKurikulum && (
        <ModalPilihKurikulum
          onTutup={() => setPilihKurikulum(false)}
          onPilih={(k) => {
            setPilihKurikulum(false)
            setForm({ kurikulum: k })
          }}
        />
      )}
      {melihat && (
        <ModalBingkai onTutup={() => setMelihat(null)} lebar>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_META[melihat.status]?.badge}`}>
                  {STATUS_META[melihat.status]?.label}
                </span>
                {melihat.status === 'disetujui' && melihat.peninjau && (
                  <span className="text-xs text-slate-500">
                    oleh {melihat.peninjau.name}, {formatTanggal(melihat.ditinjau_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TombolUnduh unduh={(f) => api.unduhModulAjar(melihat.id, f, namaFileModul(melihat, f))} />
                <TombolTutup onClick={() => setMelihat(null)} />
              </div>
            </div>
            <CatatanReview modul={melihat} />
            <DokumenPerangkatAjar modul={melihat} identitas={opsi?.identitas} />
          </div>
        </ModalBingkai>
      )}
      {hapus && (
        <ModalKonfirmasi
          judul="Hapus perangkat ajar"
          pesan={
            <>
              Yakin ingin menghapus <b>{hapus.judul}</b> beserta lampirannya? Tindakan ini tidak dapat dibatalkan.
            </>
          }
          labelYa={memproses ? 'Menghapus...' : 'Hapus'}
          bahaya
          sibuk={memproses}
          onBatal={() => setHapus(null)}
          onYa={konfirmasiHapus}
        />
      )}
    </Latar>
  )
}

// Latar netral untuk halaman ini (menutupi latar gradien dasbor) supaya
// formulir panjang nyaman dibaca; hijau hanya sebagai aksen.
function Latar({ children }) {
  return <div className="-m-6 sm:-m-8 p-6 sm:p-8 min-h-screen bg-slate-50">{children}</div>
}

function KartuModul({ modul: m, onLihat, onEdit, onHapus, onTarik }) {
  const meta = KURIKULUM_META[m.kurikulum]
  const status = STATUS_META[m.status] || STATUS_META.draft
  return (
    <div className={`${KARTU} p-5 flex flex-col`}>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.short}</span>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status.badge}`}>{status.label}</span>
      </div>
      <h3 className="font-bold text-slate-900 leading-snug">{m.judul}</h3>
      <p className="text-xs text-slate-500 mt-1">
        {[m.mata_pelajaran, m.kelas, m.data?.semester && `Semester ${m.data.semester}`].filter(Boolean).join(' · ') || meta.label}
      </p>
      {m.status === 'revisi' && m.catatan_review && (
        <p className="mt-3 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-800 line-clamp-3">
          <b>Catatan revisi:</b> {m.catatan_review}
        </p>
      )}
      <p className="text-[11px] text-slate-400 mt-auto pt-4">
        {m.status === 'diajukan' ? `Diajukan ${formatTanggal(m.diajukan_at)}` : `Diperbarui ${formatTanggal(m.updated_at)}`}
        {m.lampiran?.length > 0 && ` · ${m.lampiran.length} lampiran`}
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={onLihat} className={`${TOMBOL_KEDUA} flex-1 !py-2 !text-xs`}>
          Lihat
        </button>
        {bisaDiubah(m) && (
          <button onClick={onEdit} className={`${TOMBOL_UTAMA} flex-1 !py-2 !text-xs`}>
            {m.status === 'revisi' ? 'Perbaiki' : 'Edit'}
          </button>
        )}
        {m.status === 'diajukan' && (
          <button onClick={onTarik} className={`${TOMBOL_KEDUA} flex-1 !py-2 !text-xs`} title="Batalkan pengajuan supaya bisa diubah lagi">
            Tarik Pengajuan
          </button>
        )}
        {m.status !== 'disetujui' && (
          <button onClick={onHapus} className="text-xs font-semibold px-3 py-2 rounded-full text-red-600 hover:bg-red-50">
            Hapus
          </button>
        )}
      </div>
      <TombolUnduh kecil unduh={(f) => api.unduhModulAjar(m.id, f, namaFileModul(m, f))} />
    </div>
  )
}

function CatatanReview({ modul }) {
  if (!modul.catatan_review || !['revisi', 'disetujui'].includes(modul.status)) return null
  const revisi = modul.status === 'revisi'
  return (
    <div
      className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
        revisi ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      <p className="font-semibold">
        {revisi ? 'Catatan revisi' : 'Catatan peninjau'}
        {modul.peninjau && <span className="font-normal"> dari {modul.peninjau.name}</span>}
      </p>
      <p className="mt-0.5 whitespace-pre-line">{modul.catatan_review}</p>
    </div>
  )
}

// Tombol unduh PDF / Word. `unduh(format)` mengembalikan promise.
export function TombolUnduh({ unduh, kecil }) {
  const [proses, setProses] = useState(null)
  const [gagal, setGagal] = useState('')

  async function jalankan(format) {
    setProses(format)
    setGagal('')
    try {
      await unduh(format)
    } catch (e) {
      setGagal(e.message)
    } finally {
      setProses(null)
    }
  }

  const kelas = kecil
    ? 'flex-1 text-xs font-semibold py-2 rounded-full border bg-white hover:bg-slate-50 disabled:opacity-50'
    : 'text-sm font-semibold px-4 py-2 rounded-full border bg-white hover:bg-slate-50 disabled:opacity-50'
  return (
    <div className={kecil ? 'mt-2' : ''}>
      <div className="flex gap-2">
        <button onClick={() => jalankan('pdf')} disabled={!!proses} className={`${kelas} text-red-700 border-red-200`}>
          {proses === 'pdf' ? 'Menyiapkan...' : '⬇ PDF'}
        </button>
        <button onClick={() => jalankan('docx')} disabled={!!proses} className={`${kelas} text-blue-700 border-blue-200`}>
          {proses === 'docx' ? 'Menyiapkan...' : '⬇ Word (.docx)'}
        </button>
      </div>
      {gagal && <p className="text-[11px] text-red-600 mt-1">{gagal}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Formulir bertahap                                                    */
/* ------------------------------------------------------------------ */

function formAwal(modul, kurikulum, opsi) {
  const data = normalisasi(modul?.data, kurikulum)
  if (!data.alokasi.menit_per_jp && opsi?.menit_per_jp) data.alokasi.menit_per_jp = opsi.menit_per_jp
  // Identitas terisi otomatis dari akun & sekolah, tetap bisa diubah guru.
  const idt = opsi?.identitas || {}
  const sekolah = kurikulum === 'merdeka' ? 'institusi' : 'nama_sekolah'
  data.nama_guru = data.nama_guru || idt.nama_guru || ''
  data[sekolah] = data[sekolah] || idt.institusi || ''
  data.jenjang = data.jenjang || idt.jenjang || ''
  data.tahun_penyusunan = data.tahun_penyusunan || idt.tahun_penyusunan || ''
  if (kurikulum === 'merdeka') {
    data.nip_guru = data.nip_guru || idt.nip_guru || ''
    data.kota = data.kota || idt.kota || ''
    data.tahun_ajaran = data.tahun_ajaran || idt.tahun_ajaran || ''
  }
  return {
    id: modul?.id || null,
    kurikulum,
    judul: modul?.judul || '',
    mata_pelajaran_id: modul?.mata_pelajaran_id || '',
    kelas_id: modul?.kelas_id || '',
    data,
  }
}

function payload(form) {
  return {
    kurikulum: form.kurikulum,
    judul: form.judul.trim(),
    mata_pelajaran_id: form.mata_pelajaran_id || null,
    kelas_id: form.kelas_id || null,
    data: form.data,
  }
}

// Cadangan isian di perangkat (localStorage) bila simpan ke server gagal.
const kunciCadangan = (form) => `perangkat-ajar:cadangan:${form.id || `baru-${form.kurikulum}`}`

function bacaCadangan(kunci) {
  try {
    return JSON.parse(localStorage.getItem(kunci) || 'null')
  } catch {
    return null
  }
}

function hapusCadangan(kunci) {
  try {
    localStorage.removeItem(kunci)
  } catch {
    /* penyimpanan diblokir: abaikan */
  }
}

function FormPerangkatAjar({ modul, kurikulum, opsi, onTutup }) {
  const [form, setForm] = useState(() => formAwal(modul, kurikulum, opsi))
  const [langkah, setLangkah] = useState(0)
  const [lampiran, setLampiran] = useState(modul?.lampiran || [])
  const [simpan, setSimpan] = useState({ status: modul ? 'tersimpan' : 'baru', waktu: modul?.updated_at })
  const [galat, setGalat] = useState('')
  const [pratinjau, setPratinjau] = useState(false)
  const [konfirmasiAjukan, setKonfirmasiAjukan] = useState(false)
  const [mengajukan, setMengajukan] = useState(false)
  const [cadangan, setCadangan] = useState(() => {
    const c = bacaCadangan(kunciCadangan(formAwal(modul, kurikulum, opsi)))
    return c && (!modul || new Date(c.waktu) > new Date(modul.updated_at)) ? c : null
  })
  const kotor = useRef(false)
  const antrean = useRef(Promise.resolve(true))
  const formRef = useRef(form)
  formRef.current = form

  const langkahList = LANGKAH[kurikulum]
  const kurang = useMemo(() => kekurangan(form, kurikulum), [form, kurikulum])
  const totalKurang = Object.values(kurang).flat().length
  const jumlahPertemuan = form.data.pertemuan.length
  const totalWajib = useMemo(() => {
    const kosong = formAwal(null, kurikulum, null)
    kosong.data.pertemuan = Array.from({ length: jumlahPertemuan }, () => pertemuanKosong(kurikulum))
    return Object.values(kekurangan(kosong, kurikulum)).flat().length
  }, [jumlahPertemuan, kurikulum])
  const progres = totalWajib ? Math.round(((totalWajib - totalKurang) / totalWajib) * 100) : 100

  const mapel = opsi?.mengajar?.find((m) => String(m.mata_pelajaran_id) === String(form.mata_pelajaran_id))
  const kelas = mapel?.kelas.find((k) => String(k.id) === String(form.kelas_id))

  function ubah(perubahan) {
    kotor.current = true
    setForm((f) => {
      const baru = typeof perubahan === 'function' ? perubahan(f) : { ...f, ...perubahan }
      try {
        localStorage.setItem(kunciCadangan(baru), JSON.stringify({ form: baru, waktu: new Date().toISOString() }))
      } catch {
        /* penyimpanan perangkat penuh/diblokir: abaikan */
      }
      return baru
    })
  }
  const ubahData = (k, v) => ubah((f) => ({ ...f, data: { ...f.data, [k]: v } }))

  // Simpan ke server; antrean memastikan penyimpanan tidak tumpang tindih.
  const simpanSekarang = useCallback(() => {
    antrean.current = antrean.current.then(async () => {
      const f = formRef.current
      if (!f.judul.trim()) {
        setSimpan({ status: 'butuh-judul' })
        return false
      }
      kotor.current = false
      setSimpan((s) => ({ ...s, status: 'menyimpan' }))
      try {
        const hasil = f.id ? await api.updateModulAjar(f.id, payload(f)) : await api.createModulAjar(payload(f))
        if (!f.id) {
          hapusCadangan(kunciCadangan(f))
          formRef.current = { ...formRef.current, id: hasil.id }
          setForm((x) => ({ ...x, id: hasil.id }))
        }
        if (!kotor.current) hapusCadangan(kunciCadangan({ ...f, id: hasil.id }))
        setLampiran(hasil.lampiran || [])
        setGalat('')
        setSimpan({ status: 'tersimpan', waktu: hasil.updated_at })
        return true
      } catch (e) {
        kotor.current = true
        setGalat(e.errors ? Object.values(e.errors).flat().join(' ') : e.message)
        setSimpan({ status: 'gagal' })
        return false
      }
    })
    return antrean.current
  }, [])

  // Simpan otomatis 2 detik setelah berhenti mengetik.
  useEffect(() => {
    if (!kotor.current) return
    const t = setTimeout(simpanSekarang, 2000)
    return () => clearTimeout(t)
  }, [form, simpanSekarang])

  useEffect(() => {
    const cegah = (e) => {
      if (kotor.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', cegah)
    return () => window.removeEventListener('beforeunload', cegah)
  }, [])

  async function tutup() {
    if (kotor.current && formRef.current.judul.trim()) await simpanSekarang()
    onTutup()
  }

  async function ajukan() {
    setMengajukan(true)
    const ok = await simpanSekarang()
    if (!ok) {
      setMengajukan(false)
      setKonfirmasiAjukan(false)
      return
    }
    try {
      await api.ajukanModulAjar(formRef.current.id)
      onTutup()
    } catch (e) {
      setGalat(e.errors?.kekurangan ? `Masih ada isian wajib yang kosong: ${e.errors.kekurangan.join(', ')}.` : e.message)
      setKonfirmasiAjukan(false)
    } finally {
      setMengajukan(false)
    }
  }

  function pulihkan() {
    kotor.current = true
    setForm({ ...cadangan.form, id: form.id })
    setCadangan(null)
  }

  const meta = KURIKULUM_META[kurikulum]
  const props = { form, ubah, ubahData, kurang, opsi, mapel, kelas, kurikulum }

  return (
    <div>
      <button onClick={tutup} className="text-sm text-slate-500 hover:text-slate-800 mb-1 block">
        ← Kembali ke daftar
      </button>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-xl font-extrabold text-slate-900">
          {modul ? (modul.status === 'revisi' ? 'Perbaiki' : 'Edit') : 'Buat'} {meta.short}
        </h1>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.label}</span>
      </div>

      {modul && <CatatanReview modul={modul} />}
      {cadangan && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <span>Ada isian yang belum tersimpan ke server dari {formatTanggal(cadangan.waktu, true)}.</span>
          <button onClick={pulihkan} className="font-semibold underline">
            Pulihkan
          </button>
          <button
            onClick={() => {
              hapusCadangan(kunciCadangan(form))
              setCadangan(null)
            }}
            className="text-amber-700"
          >
            Abaikan
          </button>
        </div>
      )}

      {/* Langkah + indikator kelengkapan */}
      <div className={`${KARTU} p-4 mb-5`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-sm font-semibold text-slate-700">
            Kelengkapan isian wajib: <span className="text-emerald-700">{progres}%</span>
          </p>
          <p className="text-xs text-slate-500">{totalKurang ? `${totalKurang} isian wajib (*) belum diisi` : 'Siap diajukan'}</p>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progres}%` }} />
        </div>
        <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${langkahList.length}, minmax(0, 1fr))` }}>
          {langkahList.map((l, i) => {
            const n = kurang[l.k].length
            const aktif = i === langkah
            return (
              <li key={l.k}>
                <button
                  type="button"
                  onClick={() => setLangkah(i)}
                  title={n > 0 ? `Isian wajib yang belum diisi: ${kurang[l.k].join(', ')}` : 'Semua isian wajib sudah diisi'}
                  className={`w-full flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 rounded-xl px-2 py-2 text-left ${
                    aktif ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      aktif ? 'bg-emerald-600 text-white' : n === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {n === 0 && !aktif ? '✓' : i + 1}
                  </span>
                  <span className="min-w-0 text-center sm:text-left">
                    <span className={`block text-xs sm:text-sm font-semibold truncate ${aktif ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {l.label}
                    </span>
                    {n > 0 && <span className="hidden sm:block text-[11px] text-orange-600">{n} isian wajib belum diisi</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        {kurang[langkahList[langkah].k].length > 0 && (
          <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
            <b>Belum diisi di langkah ini:</b> {kurang[langkahList[langkah].k].join(', ')}.{' '}
            <span className="text-orange-700/80">Isian bertanda * wajib dilengkapi sebelum diajukan; draf tetap bisa disimpan kapan saja.</span>
          </p>
        )}
      </div>

      {galat && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{galat}</p>}

      <div className="max-w-4xl space-y-4">
        {langkahList[langkah].k === 'identitas' && <LangkahIdentitas {...props} />}
        {langkahList[langkah].k === 'desain' && <LangkahDesain {...props} />}
        {langkahList[langkah].k === 'umum' && <LangkahUmum {...props} />}
        {langkahList[langkah].k === 'inti' && <LangkahInti {...props} />}
        {langkahList[langkah].k === 'kegiatan' && <LangkahKegiatan {...props} />}
        {langkahList[langkah].k === 'asesmen' && <LangkahAsesmen {...props} />}
        {langkahList[langkah].k === 'lampiran' && kurikulum === 'merdeka' && <LampiranMerdeka {...props} />}
        {langkahList[langkah].k === 'lampiran' && (
          <LangkahLampiran
            idModul={form.id}
            lampiran={lampiran}
            setLampiran={setLampiran}
            opsi={opsi}
            simpanDulu={async () => ((await simpanSekarang()) ? formRef.current.id : null)}
          />
        )}
      </div>

      {/* Bilah aksi menempel di bawah layar */}
      <div className="sticky bottom-0 z-30 -mx-6 sm:-mx-8 mt-8 border-t border-slate-200 bg-white/95 backdrop-blur px-6 sm:px-8 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusSimpan simpan={simpan} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setLangkah((l) => l - 1)} disabled={langkah === 0} className={TOMBOL_KEDUA}>
              ← Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setLangkah((l) => l + 1)}
              disabled={langkah === langkahList.length - 1}
              className={TOMBOL_KEDUA}
            >
              Berikutnya →
            </button>
            <button type="button" onClick={() => setPratinjau(true)} className={TOMBOL_KEDUA}>
              Pratinjau
            </button>
            <button type="button" onClick={simpanSekarang} disabled={simpan.status === 'menyimpan'} className={TOMBOL_KEDUA}>
              Simpan sebagai Draf
            </button>
            <button
              type="button"
              onClick={() => setKonfirmasiAjukan(true)}
              disabled={totalKurang > 0}
              title={totalKurang > 0 ? `Lengkapi ${totalKurang} isian wajib terlebih dahulu` : ''}
              className={TOMBOL_UTAMA}
            >
              Ajukan ke Kepala Sekolah
            </button>
          </div>
        </div>
      </div>

      {pratinjau && (
        <ModalBingkai onTutup={() => setPratinjau(false)} lebar>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <p className="text-sm font-semibold text-slate-600">Pratinjau dokumen (isian saat ini, termasuk yang belum disimpan)</p>
              <div className="flex items-center gap-2">
                <TombolUnduh
                  unduh={(f) => {
                    if (!form.judul.trim()) return Promise.reject(new Error('Isi judul terlebih dahulu.'))
                    return api.pratinjauModulAjar(f, { ...payload(form), id: form.id }, namaFileModul(form, f))
                  }}
                />
                <TombolTutup onClick={() => setPratinjau(false)} />
              </div>
            </div>
            <DokumenPerangkatAjar
              modul={{
                ...form,
                mata_pelajaran: mapel?.nama_mapel,
                kelas: kelas?.nama_kelas,
                lampiran,
                data: { ...form.data, fase: kelas?.fase || form.data.fase },
              }}
              identitas={opsi?.identitas}
            />
          </div>
        </ModalBingkai>
      )}
      {konfirmasiAjukan && (
        <ModalKonfirmasi
          judul="Ajukan perangkat ajar?"
          pesan="Perangkat ajar akan dikirim ke Kepala Sekolah / Waka Kurikulum untuk ditinjau. Selama ditinjau isiannya tidak bisa diubah, tetapi Anda bisa menarik pengajuan selama belum ditinjau."
          labelYa={mengajukan ? 'Mengajukan...' : 'Ajukan'}
          sibuk={mengajukan}
          onBatal={() => setKonfirmasiAjukan(false)}
          onYa={ajukan}
        />
      )}
    </div>
  )
}

function StatusSimpan({ simpan }) {
  const jam = simpan.waktu ? new Date(simpan.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
  const teks = {
    baru: 'Belum disimpan',
    'butuh-judul': 'Isi judul agar tersimpan otomatis',
    menyimpan: 'Menyimpan...',
    tersimpan: `✓ Tersimpan ${jam}`,
    gagal: 'Gagal menyimpan — isian tetap aman di perangkat ini',
  }[simpan.status]
  const warna = { tersimpan: 'text-emerald-700', gagal: 'text-red-600' }[simpan.status] || 'text-slate-500'
  return <p className={`text-xs font-medium ${warna}`}>{teks}</p>
}

function Label({ children, wajib, bantu }) {
  return (
    <div className="mb-1.5">
      <p className="text-[13px] font-semibold text-slate-700">
        {children}
        {wajib && <span className="text-red-500 ml-0.5" title="Wajib diisi sebelum diajukan">*</span>}
      </p>
      {bantu && <p className="text-xs text-slate-500">{bantu}</p>}
    </div>
  )
}

function Kotak({ judul, keterangan, children }) {
  return (
    <section className={`${KARTU} p-5 sm:p-6`}>
      <h2 className="text-sm font-bold text-slate-900">{judul}</h2>
      {keterangan && <p className="text-xs text-slate-500 mt-0.5">{keterangan}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function FieldEditor({ f, form, ubahData }) {
  const kosong = !teksPolos(form.data[f.k])
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Label wajib={f.wajib} bantu={f.bantu}>
          {f.label}
        </Label>
        {f.kerangka && kosong && <TombolKerangka onClick={() => ubahData(f.k, f.kerangka)} />}
      </div>
      <EditorTeks value={form.data[f.k]} onChange={(v) => ubahData(f.k, v)} wajib={f.wajib} />
    </div>
  )
}

// Menyisipkan kerangka isian (mis. langkah pendahuluan, tabel rubrik) yang lalu dilengkapi guru.
function TombolKerangka({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full px-3 py-1"
    >
      + Sisipkan kerangka
    </button>
  )
}

function Pilihan({ daftar, terpilih, onUbah, kolom = 'sm:grid-cols-2' }) {
  const set = new Set(terpilih || [])
  return (
    <div className={`grid ${kolom} gap-2`}>
      {daftar.map((x) => (
        <label
          key={x}
          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm cursor-pointer ${
            set.has(x) ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <input
            type="checkbox"
            className="mt-0.5 accent-emerald-600"
            checked={set.has(x)}
            onChange={() => onUbah(set.has(x) ? [...set].filter((y) => y !== x) : [...set, x])}
          />
          {x}
        </label>
      ))}
    </div>
  )
}

function IsianTeks({ label, nilai, onUbah, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <input value={nilai || ''} onChange={(e) => onUbah(e.target.value)} className={INPUT} maxLength={255} placeholder={placeholder} />
    </div>
  )
}

function LangkahIdentitas({ form, ubah, ubahData, opsi, mapel, kelas, kurikulum }) {
  const d = form.data
  const a = d.alokasi
  const total = a.pertemuan && a.jp && a.menit_per_jp ? a.pertemuan * a.jp * a.menit_per_jp : null
  const tidakMengajar = opsi && opsi.mengajar.length === 0

  function ubahAlokasi(k, v) {
    const nilai = v === '' ? '' : Math.max(0, parseInt(v, 10) || 0)
    ubah((f) => {
      const data = { ...f.data, alokasi: { ...f.data.alokasi, [k]: nilai } }
      // Jumlah kartu pertemuan mengikuti alokasi; kartu kosong di akhir dibuang.
      if (k === 'pertemuan' && nilai > 0) {
        const p = [...data.pertemuan]
        while (p.length < nilai && p.length < 50) p.push(pertemuanKosong(kurikulum))
        while (p.length > nilai && !p[p.length - 1].topik && !Object.values(p[p.length - 1].tahap).some((t) => t.isi)) p.pop()
        data.pertemuan = p
      }
      return { ...f, data }
    })
  }

  return (
    <>
      <Kotak judul="Identitas" keterangan="Data guru dan sekolah sudah terisi dari akun Anda; ubah bila perlu.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <IsianTeks label="Nama Guru" nilai={d.nama_guru} onUbah={(v) => ubahData('nama_guru', v)} />
          <IsianTeks
            label={kurikulum === 'merdeka' ? 'Institusi / Sekolah' : 'Nama Sekolah'}
            nilai={d[kurikulum === 'merdeka' ? 'institusi' : 'nama_sekolah']}
            onUbah={(v) => ubahData(kurikulum === 'merdeka' ? 'institusi' : 'nama_sekolah', v)}
          />
          <IsianTeks label="Jenjang" nilai={d.jenjang} onUbah={(v) => ubahData('jenjang', v)} placeholder="mis. SMA" />
          <IsianTeks label="Tahun Penyusunan" nilai={d.tahun_penyusunan} onUbah={(v) => ubahData('tahun_penyusunan', v)} />
        </div>
        {kurikulum === 'merdeka' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IsianTeks label="NIP Penyusun" nilai={d.nip_guru} onUbah={(v) => ubahData('nip_guru', v)} placeholder="Kosongkan bila tidak ada" />
            <IsianTeks label="Kota / Kabupaten" nilai={d.kota} onUbah={(v) => ubahData('kota', v)} />
            <div>
              <Label wajib>Tahun Ajaran</Label>
              <input value={d.tahun_ajaran || ''} onChange={(e) => ubahData('tahun_ajaran', e.target.value)} className={INPUT} maxLength={20} placeholder="mis. 2025/2026" />
            </div>
            <IsianTeks label="Bab / Tema / Unit" nilai={d.bab_tema} onUbah={(v) => ubahData('bab_tema', v)} placeholder="mis. Bab 2 – Ekosistem" />
          </div>
        )}
        <div>
          <Label wajib>{kurikulum === 'merdeka' ? 'Judul Modul Ajar' : 'Judul RPP'}</Label>
          <input
            value={form.judul}
            onChange={(e) => ubah({ judul: e.target.value })}
            className={INPUT}
            maxLength={255}
            placeholder="mis. Ekosistem dan Rantai Makanan"
          />
        </div>
        {tidakMengajar && (
          <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            Anda belum memiliki jadwal mengajar, sehingga mata pelajaran dan kelas belum bisa dipilih. Hubungi Waka Kurikulum untuk
            mengatur jadwal mengajar Anda.
          </p>
        )}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label wajib bantu="Sesuai jadwal mengajar">
              Mata Pelajaran
            </Label>
            <select
              value={form.mata_pelajaran_id}
              onChange={(e) => {
                const baru = opsi.mengajar.find((m) => String(m.mata_pelajaran_id) === e.target.value)
                const kelasMasih = baru?.kelas.some((k) => String(k.id) === String(form.kelas_id))
                ubah((f) => ({ ...f, mata_pelajaran_id: e.target.value, kelas_id: kelasMasih ? f.kelas_id : '' }))
              }}
              className={INPUT}
              disabled={tidakMengajar}
            >
              <option value="">Pilih mapel</option>
              {opsi?.mengajar.map((m) => (
                <option key={m.mata_pelajaran_id} value={m.mata_pelajaran_id}>
                  {m.nama_mapel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label wajib bantu="Rombel yang Anda ajar">
              Kelas
            </Label>
            <select
              value={form.kelas_id}
              onChange={(e) => {
                // Fase dihitung otomatis dari tingkat kelas (tidak diisi guru).
                const k = mapel?.kelas.find((x) => String(x.id) === e.target.value)
                ubah((f) => ({ ...f, kelas_id: e.target.value, data: { ...f.data, fase: k?.fase || '' } }))
              }}
              className={INPUT}
              disabled={!mapel}
            >
              <option value="">{mapel ? 'Pilih kelas, mis. X-1' : 'Pilih mapel dulu'}</option>
              {mapel?.kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label wajib bantu="Ganjil / Genap">
              Semester
            </Label>
            <select value={d.semester || ''} onChange={(e) => ubahData('semester', e.target.value)} className={INPUT}>
              <option value="">Pilih semester</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>
        {kurikulum === 'k13' && (
          <div>
            <Label wajib>Materi Pokok</Label>
            <input value={d.materi_pokok || ''} onChange={(e) => ubahData('materi_pokok', e.target.value)} className={INPUT} maxLength={255} />
          </div>
        )}
      </Kotak>

      <Kotak judul="Alokasi Waktu" keterangan="Jumlah pertemuan × JP per pertemuan × menit per JP.">
        <div className="flex flex-wrap items-end gap-3">
          {[
            ['pertemuan', 'Jumlah pertemuan'],
            ['jp', 'JP per pertemuan'],
            ['menit_per_jp', 'Menit per JP'],
          ].map(([k, label], i) => (
            <div key={k} className="flex items-end gap-3">
              {i > 0 && <span className="pb-2.5 text-slate-400">×</span>}
              <div className="w-36">
                <Label wajib>{label}</Label>
                <input type="number" min={1} value={a[k]} onChange={(e) => ubahAlokasi(k, e.target.value)} className={INPUT} />
              </div>
            </div>
          ))}
          <p className="pb-2.5 text-sm text-slate-600">
            = <b className="text-slate-900">{total ? `${total} menit` : '…'}</b>
          </p>
        </div>
      </Kotak>
    </>
  )
}

function LangkahDesain(props) {
  const { form, ubahData } = props
  const d = form.data
  return (
    <Kotak judul="Tujuan Pembelajaran">
      {FIELD.k13.desain.map((f) => (
        <FieldEditor key={f.k} f={f} {...props} />
      ))}
      <div className="w-40">
        <Label wajib>KKM</Label>
        <input value={d.kkm || ''} onChange={(e) => ubahData('kkm', e.target.value)} className={INPUT} placeholder="mis. 75" maxLength={10} />
      </div>
    </Kotak>
  )
}

/** A. Informasi Umum (Kurikulum Merdeka): moda, metode, model, peserta didik, profil, sarana. */
function LangkahUmum(props) {
  const { form, ubahData } = props
  const d = form.data
  return (
    <>
      <Kotak judul="Pelaksanaan Pembelajaran">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label wajib>Moda Pembelajaran</Label>
            <select value={d.moda || ''} onChange={(e) => ubahData('moda', e.target.value)} className={INPUT}>
              <option value="">Pilih moda</option>
              {MODA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label wajib bantu="mis. PBL, Discovery Learning, CIRC">
              Model Pembelajaran
            </Label>
            <input
              value={d.model_pembelajaran || ''}
              onChange={(e) => ubahData('model_pembelajaran', e.target.value)}
              className={INPUT}
              placeholder="mis. Problem Based Learning (PBL)"
              maxLength={255}
            />
          </div>
        </div>
        <div>
          <Label wajib>Metode Pembelajaran</Label>
          <Pilihan daftar={METODE} terpilih={d.metode} onUbah={(v) => ubahData('metode', v)} kolom="grid-cols-2 sm:grid-cols-5" />
          <input
            value={d.metode_lain || ''}
            onChange={(e) => ubahData('metode_lain', e.target.value)}
            className={`${INPUT} mt-2`}
            placeholder="Metode lain (opsional), mis. eksperimen"
            maxLength={255}
          />
        </div>
      </Kotak>
      <Kotak judul="Peserta Didik">
        <div>
          <Label>Target Peserta Didik</Label>
          <Pilihan daftar={TARGET_PESERTA} terpilih={d.target_peserta} onUbah={(v) => ubahData('target_peserta', v)} kolom="sm:grid-cols-3" />
        </div>
        <div className="w-56">
          <Label bantu="Jumlah yang direkomendasikan">Jumlah Peserta Didik</Label>
          <input
            type="number"
            min={1}
            value={d.jumlah_peserta || ''}
            onChange={(e) => ubahData('jumlah_peserta', e.target.value)}
            className={INPUT}
            placeholder="mis. 32"
          />
        </div>
        <FieldEditor f={FIELD.merdeka.umum[0]} {...props} />
      </Kotak>
      <Kotak judul="Profil Pelajar Pancasila" keterangan="Dimensi yang dikembangkan melalui pembelajaran ini.">
        <div>
          <Label wajib>Pilih dimensi</Label>
          <Pilihan daftar={PROFIL_PELAJAR} terpilih={d.profil_pelajar} onUbah={(v) => ubahData('profil_pelajar', v)} kolom="sm:grid-cols-2 lg:grid-cols-3" />
        </div>
      </Kotak>
      <Kotak judul="Sarana dan Prasarana">
        <FieldEditor f={FIELD.merdeka.umum[1]} {...props} />
      </Kotak>
    </>
  )
}

/** B. Komponen Inti 1–5 (Kurikulum Merdeka): CP, TP, ATP, pemahaman bermakna, materi inti. */
function LangkahInti(props) {
  const f = FIELD.merdeka.inti
  return (
    <>
      <PemilihCpTp {...props} />
      <EditorAtp {...props} />
      <Kotak judul="Pemahaman Bermakna & Materi Inti">
        <FieldEditor f={f.pemahaman_bermakna} {...props} />
        <FieldEditor f={f.materi_inti} {...props} />
      </Kotak>
    </>
  )
}

/** Alur Tujuan Pembelajaran: "Melalui kegiatan …, peserta didik dapat …" per minggu/pertemuan. */
function EditorAtp({ form, ubah }) {
  const atp = form.data.atp || []
  const ubahAtp = (fn) => ubah((x) => ({ ...x, data: { ...x.data, atp: fn(x.data.atp || []) } }))
  const ubahBaris = (i, k, v) => ubahAtp((a) => a.map((b, j) => (j === i ? { ...b, [k]: v } : b)))
  return (
    <Kotak
      judul="Alur Tujuan Pembelajaran (ATP)"
      keterangan='Dirumuskan dengan pola "Melalui kegiatan …, peserta didik dapat …", dikelompokkan per minggu atau pertemuan.'
    >
      <Label wajib>Baris ATP</Label>
      <div className="space-y-3">
        {atp.map((a, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="grid md:grid-cols-[9rem_1fr_1fr_auto] gap-2 items-start">
              <input
                value={a.waktu}
                onChange={(e) => ubahBaris(i, 'waktu', e.target.value)}
                className={INPUT}
                placeholder="Pertemuan 1"
                maxLength={60}
                aria-label="Waktu (minggu/pertemuan)"
              />
              <input
                value={a.kegiatan}
                onChange={(e) => ubahBaris(i, 'kegiatan', e.target.value)}
                className={INPUT}
                placeholder="Melalui kegiatan … (mis. mengamati gambar ekosistem)"
                maxLength={500}
                aria-label="Melalui kegiatan"
              />
              <input
                value={a.kemampuan}
                onChange={(e) => ubahBaris(i, 'kemampuan', e.target.value)}
                className={INPUT}
                placeholder="peserta didik dapat … (mis. mengidentifikasi komponen ekosistem)"
                maxLength={500}
                aria-label="Peserta didik dapat"
              />
              <button
                type="button"
                onClick={() => ubahAtp((x) => x.filter((_, j) => j !== i))}
                disabled={atp.length === 1}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 rounded-full px-3 py-2 disabled:opacity-30"
              >
                Hapus
              </button>
            </div>
            {a.kegiatan?.trim() && a.kemampuan?.trim() && <p className="text-xs text-slate-500 italic">{kalimatAtp(a)}</p>}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => ubahAtp((x) => [...x, atpKosong(x[x.length - 1]?.waktu || '')])}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 py-2 text-sm font-semibold text-slate-600"
      >
        + Tambah baris ATP
      </button>
    </Kotak>
  )
}

/** C. Lampiran isian teks (Kurikulum Merdeka); unggah berkas tetap di LangkahLampiran. */
function LampiranMerdeka(props) {
  const { form, ubahData } = props
  const daftar = FIELD.merdeka.lampiran
  return (
    <>
      <Kotak judul="Bahan Bacaan & LKPD">
        {daftar.slice(0, 2).map((f) => (
          <FieldEditor key={f.k} f={f} {...props} />
        ))}
      </Kotak>
      <Kotak judul="Rubrik Penilaian">
        {daftar.slice(2, 4).map((f) => (
          <FieldEditor key={f.k} f={f} {...props} />
        ))}
        <div>
          <Label bantu="Kosongkan untuk memakai rumus bawaan">Rumus Pengolahan Nilai</Label>
          <input
            value={form.data.rumus_nilai || ''}
            onChange={(e) => ubahData('rumus_nilai', e.target.value)}
            className={INPUT}
            placeholder={RUMUS_NILAI_BAWAAN}
            maxLength={255}
          />
        </div>
      </Kotak>
      <Kotak judul="Remedial, Pengayaan & Daftar Pustaka">
        {daftar.slice(4).map((f) => (
          <FieldEditor key={f.k} f={f} {...props} />
        ))}
      </Kotak>
    </>
  )
}

// CP dipilih dari data master (mapel + fase); TP diturunkan dari CP terpilih.
function PemilihCpTp(props) {
  const { form, ubah, mapel, kelas } = props
  const d = form.data
  const [cpList, setCpList] = useState(null)
  const [galat, setGalat] = useState('')
  const mapelId = mapel?.mata_pelajaran_id
  const fase = kelas?.fase || form.data.fase

  useEffect(() => {
    if (!mapelId || !fase) {
      setCpList(null)
      return
    }
    setCpList(undefined)
    api
      .getCapaianModulAjar({ mata_pelajaran_id: mapelId, fase })
      .then((r) => {
        setCpList(r)
        setGalat('')
      })
      .catch((e) => {
        setCpList([])
        setGalat(e.message)
      })
  }, [mapelId, fase])

  const cpIds = new Set(d.cp_ids || [])
  const tpIds = new Set(d.tp_ids || [])
  const semester = (d.semester || '').toLowerCase()
  const tpDari = (ids) => (cpList || []).filter((c) => ids.includes(c.id)).flatMap((c) => c.tujuan.map((t) => ({ ...t, elemen: c.elemen })))
  const tpTampil = tpDari([...cpIds]).filter((t) => !semester || t.semester === semester)

  // Ringkasan CP/TP ikut disimpan agar pratinjau langsung lengkap (server
  // tetap mengambil ulang dari data master saat menyimpan).
  function pilihCp(c) {
    ubah((f) => {
      const lama = f.data.cp_ids || []
      const ids = lama.includes(c.id) ? lama.filter((x) => x !== c.id) : [...lama, c.id]
      const tpSah = new Set(tpDari(ids).map((t) => t.id))
      const tp = (f.data.tp_ids || []).filter((x) => tpSah.has(x))
      return {
        ...f,
        data: {
          ...f.data,
          cp_ids: ids,
          cp: (cpList || []).filter((x) => ids.includes(x.id)).map(({ id, elemen, deskripsi }) => ({ id, elemen, deskripsi })),
          tp_ids: tp,
          tp_master: tpDari(ids).filter((t) => tp.includes(t.id)).map(({ id, deskripsi }) => ({ id, deskripsi })),
        },
      }
    })
  }

  function pilihTp(t) {
    ubah((f) => {
      const lama = f.data.tp_ids || []
      const ids = lama.includes(t.id) ? lama.filter((x) => x !== t.id) : [...lama, t.id]
      return {
        ...f,
        data: {
          ...f.data,
          tp_ids: ids,
          tp_master: tpDari(f.data.cp_ids || []).filter((x) => ids.includes(x.id)).map(({ id, deskripsi }) => ({ id, deskripsi })),
        },
      }
    })
  }

  return (
    <>
      <Kotak
        judul="Capaian Pembelajaran (CP)"
        keterangan={mapel && kelas ? `Data master CP ${mapel.nama_mapel} ${labelFase(fase) || ''} yang ditetapkan Waka Kurikulum.` : null}
      >
        <div>
          <Label wajib>Pilih elemen CP yang dicakup</Label>
          {!mapel || !kelas ? (
            <p className="text-sm text-slate-500">Pilih mata pelajaran dan kelas di langkah Identitas terlebih dahulu.</p>
          ) : cpList === undefined ? (
            <p className="text-sm text-slate-400">Memuat CP...</p>
          ) : galat ? (
            <p className="text-sm text-red-600">{galat}</p>
          ) : cpList?.length === 0 ? (
            <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              Belum ada CP aktif untuk {mapel.nama_mapel} {labelFase(fase)}. Minta Waka Kurikulum mengisi data master Capaian Pembelajaran.
            </p>
          ) : (
            <div className="space-y-2">
              {cpList?.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer ${
                    cpIds.has(c.id) ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input type="checkbox" className="mt-1 accent-emerald-600" checked={cpIds.has(c.id)} onChange={() => pilihCp(c)} />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Elemen: {c.elemen}</span>
                    <span className="block text-sm text-slate-600 mt-0.5 leading-relaxed">{c.deskripsi}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Kotak>

      <Kotak judul="Tujuan Pembelajaran (TP)" keterangan="Diturunkan dari CP yang dipilih. Pilih dari daftar TP sekolah dan/atau tulis TP tambahan.">
        <div>
          <Label wajib>TP dari data master</Label>
          {cpIds.size === 0 ? (
            <p className="text-sm text-slate-500">Pilih CP terlebih dahulu.</p>
          ) : tpTampil.length === 0 ? (
            <p className="text-sm text-slate-500">
              Belum ada TP aktif untuk CP terpilih{semester ? ` di semester ${d.semester}` : ''}. Tulis TP di kolom berikut.
            </p>
          ) : (
            <div className="space-y-2">
              {tpTampil.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 cursor-pointer text-sm ${
                    tpIds.has(t.id) ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input type="checkbox" className="mt-0.5 accent-emerald-600" checked={tpIds.has(t.id)} onChange={() => pilihTp(t)} />
                  <span>
                    {t.deskripsi} <span className="text-xs text-slate-400">({t.elemen})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <FieldEditor
          f={{
            k: 'tujuan_pembelajaran',
            label: 'TP tambahan',
            bantu: 'Opsional bila TP dari data master sudah dipilih. Gunakan kata kerja operasional yang terukur.',
          }}
          {...props}
        />
      </Kotak>
    </>
  )
}

function LangkahKegiatan(props) {
  const { form, ubah, ubahData, kurikulum } = props
  const d = form.data
  const targetMenit = d.alokasi.jp && d.alokasi.menit_per_jp ? d.alokasi.jp * d.alokasi.menit_per_jp : null

  function ubahPertemuan(i, ubahan) {
    ubah((f) => ({ ...f, data: { ...f.data, pertemuan: f.data.pertemuan.map((p, j) => (j === i ? ubahan(p) : p)) } }))
  }
  function ubahTahap(i, t, k, v) {
    ubahPertemuan(i, (p) => ({ ...p, tahap: { ...p.tahap, [t]: { ...p.tahap[t], [k]: v } } }))
  }

  return (
    <>
      {kurikulum === 'k13' && (
        <Kotak judul="Model Pembelajaran">
          <div>
            <Label wajib>Model pembelajaran</Label>
            <input
              value={d.model_pembelajaran || ''}
              onChange={(e) => ubahData('model_pembelajaran', e.target.value)}
              className={INPUT}
              placeholder="mis. Problem Based Learning"
              maxLength={255}
            />
          </div>
        </Kotak>
      )}
      {d.pertemuan.map((p, i) => {
        const total = TAHAP[kurikulum].reduce((s, t) => s + (Number(p.tahap[t.k]?.durasi) || 0), 0)
        const pas = targetMenit && total === targetMenit
        return (
          <section key={i} className={`${KARTU} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900">Pertemuan {i + 1}</h2>
              <input
                value={p.topik}
                onChange={(e) => ubahPertemuan(i, (x) => ({ ...x, topik: e.target.value }))}
                placeholder="Topik / sub-materi pertemuan ini"
                className={`${INPUT} flex-1 min-w-48`}
                maxLength={255}
              />
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  !total ? 'bg-slate-100 text-slate-500' : pas ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
                title={targetMenit ? `Target per pertemuan: ${targetMenit} menit` : 'Isi alokasi waktu di langkah Identitas'}
              >
                {total}
                {targetMenit ? ` / ${targetMenit}` : ''} menit
              </span>
              {d.pertemuan.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus Pertemuan ${i + 1}?`)) {
                      ubah((f) => ({ ...f, data: { ...f.data, pertemuan: f.data.pertemuan.filter((_, j) => j !== i) } }))
                    }
                  }}
                  className="text-xs font-semibold text-red-600 hover:bg-red-50 rounded-full px-3 py-1.5"
                >
                  Hapus
                </button>
              )}
            </div>
            <div className="space-y-4">
              {TAHAP[kurikulum].map((t) => (
                <div key={t.k} className="grid md:grid-cols-[1fr_7rem] gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <Label wajib bantu={t.bantu}>
                        {t.label}
                      </Label>
                      {t.kerangka && !teksPolos(p.tahap[t.k]?.isi) && (
                        <TombolKerangka onClick={() => ubahTahap(i, t.k, 'isi', t.kerangka)} />
                      )}
                    </div>
                    <EditorTeks value={p.tahap[t.k]?.isi} onChange={(v) => ubahTahap(i, t.k, 'isi', v)} tinggi="min-h-[72px]" wajib />
                  </div>
                  <div>
                    <Label bantu="menit">Durasi</Label>
                    <input
                      type="number"
                      min={1}
                      value={p.tahap[t.k]?.durasi ?? ''}
                      onChange={(e) => ubahTahap(i, t.k, 'durasi', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className={INPUT}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
      <button
        type="button"
        onClick={() =>
          ubah((f) => ({
            ...f,
            data: {
              ...f.data,
              pertemuan: [...f.data.pertemuan, pertemuanKosong(kurikulum)],
              alokasi: { ...f.data.alokasi, pertemuan: Math.max(Number(f.data.alokasi.pertemuan) || 0, f.data.pertemuan.length + 1) },
            },
          }))
        }
        className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 py-3 text-sm font-semibold text-slate-600"
      >
        + Tambah Pertemuan
      </button>
      {FIELD[kurikulum].kegiatan.length > 0 && (
        <Kotak judul={kurikulum === 'merdeka' ? 'Kegiatan Alternatif' : 'Diferensiasi'}>
          {FIELD[kurikulum].kegiatan.map((f) => (
            <FieldEditor key={f.k} f={f} {...props} />
          ))}
        </Kotak>
      )}
    </>
  )
}

function LangkahAsesmen(props) {
  if (props.kurikulum === 'k13') {
    return (
      <Kotak judul="Penilaian Pembelajaran">
        {FIELD.k13.asesmen.map((f) => (
          <FieldEditor key={f.k} f={f} {...props} />
        ))}
      </Kotak>
    )
  }
  const grup = [
    ['Asesmen', 'Diagnostik di awal, formatif selama, dan sumatif di akhir pembelajaran.', FIELD.merdeka.asesmen],
    ['Refleksi & Interaksi dengan Orang Tua', null, FIELD.merdeka.refleksi],
  ]
  return grup.map(([judul, ket, daftar]) => (
    <Kotak key={judul} judul={judul} keterangan={ket}>
      {daftar.map((f) => (
        <FieldEditor key={f.k} f={f} {...props} />
      ))}
    </Kotak>
  ))
}

function LangkahLampiran({ idModul, lampiran, setLampiran, opsi, simpanDulu }) {
  const [jenis, setJenis] = useState('lkpd')
  const [file, setFile] = useState(null)
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState('')
  const inputRef = useRef(null)
  const jenisList = opsi?.jenis_lampiran || JENIS_LAMPIRAN

  async function unggah() {
    if (!file) return
    setProses(true)
    setGalat('')
    try {
      const id = idModul || (await simpanDulu())
      if (!id) throw new Error('Isi judul di langkah Identitas agar draf tersimpan terlebih dahulu.')
      const hasil = await api.unggahLampiranModulAjar(id, jenis, file)
      setLampiran((l) => [...l, hasil])
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) {
      setGalat(e.errors ? Object.values(e.errors).flat().join(' ') : e.message)
    } finally {
      setProses(false)
    }
  }

  async function hapus(l) {
    if (!window.confirm(`Hapus lampiran "${l.nama_file}"?`)) return
    try {
      await api.hapusLampiranModulAjar(idModul, l.id)
      setLampiran((x) => x.filter((y) => y.id !== l.id))
    } catch (e) {
      setGalat(e.message)
    }
  }

  return (
    <Kotak
      judul="Lampiran"
      keterangan="LKPD, rubrik penilaian, bahan bacaan, atau dokumen pendukung lain. Maks. 10 file @ 10 MB (PDF, Word, Excel, PowerPoint, JPG, PNG)."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Label>Jenis</Label>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} className={INPUT}>
            {Object.entries(jenisList).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-56">
          <Label>File</Label>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>
        <button type="button" onClick={unggah} disabled={!file || proses} className={TOMBOL_UTAMA}>
          {proses ? 'Mengunggah...' : 'Unggah'}
        </button>
      </div>
      {galat && <p className="text-sm text-red-600">{galat}</p>}
      {lampiran.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {lampiran.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{jenisList[l.jenis] || l.jenis}</span>
              <span className="flex-1 truncate text-slate-800">{l.nama_file}</span>
              <span className="text-xs text-slate-400">{formatUkuran(l.ukuran)}</span>
              <button
                type="button"
                onClick={() => api.unduhLampiranModulAjar(idModul, l).catch((e) => setGalat(e.message))}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Unduh
              </button>
              <button type="button" onClick={() => hapus(l)} className="text-xs font-semibold text-red-600 hover:underline">
                Hapus
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Belum ada lampiran.</p>
      )}
    </Kotak>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                                */
/* ------------------------------------------------------------------ */

export function ModalBingkai({ children, onTutup, lebar }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/40 flex items-center justify-center p-4" onClick={onTutup}>
      <div
        className={`bg-white rounded-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${lebar ? 'max-w-4xl' : 'max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function TombolTutup({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Tutup"
      className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-lg font-bold leading-none shrink-0"
    >
      &times;
    </button>
  )
}

export function ModalKonfirmasi({ judul, pesan, labelYa, bahaya, sibuk, onBatal, onYa }) {
  return (
    <ModalBingkai onTutup={() => !sibuk && onBatal()}>
      <div className="p-7 text-center">
        <h2 className="text-lg font-bold text-slate-900">{judul}</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{pesan}</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={onBatal} disabled={sibuk} className={TOMBOL_KEDUA}>
            Batal
          </button>
          <button
            onClick={onYa}
            disabled={sibuk}
            className={bahaya ? 'rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50' : TOMBOL_UTAMA}
          >
            {labelYa}
          </button>
        </div>
      </div>
    </ModalBingkai>
  )
}

function ModalPilihKurikulum({ onTutup, onPilih }) {
  return (
    <ModalBingkai onTutup={onTutup} lebar>
      <div className="p-7">
        <h2 className="text-xl font-bold text-slate-900">Pilih kurikulum</h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">Bentuk formulir menyesuaikan kurikulum yang Anda pilih.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={() => onPilih('merdeka')} className="text-left rounded-2xl border-2 border-slate-200 hover:border-emerald-500 p-5 transition-colors">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${KURIKULUM_META.merdeka.badge}`}>Modul Ajar (RPP+)</span>
            <h3 className="font-bold text-slate-900 mt-3">Kurikulum Merdeka</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Sampul, informasi umum (moda, metode, model, Profil Pelajar Pancasila), CP, TP, ATP, kegiatan per pertemuan
              (pendahuluan – inti – penutup), asesmen, refleksi, LKPD, rubrik, dan lembar pengesahan.
            </p>
          </button>
          <button onClick={() => onPilih('k13')} className="text-left rounded-2xl border-2 border-slate-200 hover:border-amber-500 p-5 transition-colors">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${KURIKULUM_META.k13.badge}`}>RPP 1 Lembar</span>
            <h3 className="font-bold text-slate-900 mt-3">Kurikulum 2013</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Format ringkas Permendikbud No. 14/2019: tujuan pembelajaran (berdasar KD), langkah pembelajaran, dan penilaian.
              Dalam masa penghapusan bertahap.
            </p>
          </button>
        </div>
        <button onClick={onTutup} className="mt-5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          Batal
        </button>
      </div>
    </ModalBingkai>
  )
}
