import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { HARI_PENDEK, KATEGORI_TITIK, NAMA_BULAN, TONE_KEGIATAN, toIso } from './ekskulKonstanta'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { selectClass, tgl } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'

function FormKegiatan({ opsi, daftarEkskul, kegiatan, tanggalAwal, ekskulAwal, onClose, onSaved }) {
  const edit = Boolean(kegiatan)
  const aktif = daftarEkskul.filter((e) => e.status === 'aktif' || e.id === kegiatan?.ekskul.id)
  const [f, setF] = useState(() =>
    edit
      ? { ekskul_id: kegiatan.ekskul.id, jenis: kegiatan.jenis, tanggal: kegiatan.tanggal, jam_mulai: kegiatan.jam_mulai, jam_selesai: kegiatan.jam_selesai, tempat: kegiatan.tempat ?? '', pembina_guru_id: kegiatan.pembina_guru_id ?? '', pelaksana: kegiatan.pelaksana ?? '', materi: kegiatan.materi ?? '', keterangan: kegiatan.keterangan ?? '' }
      : { ekskul_id: ekskulAwal || aktif[0]?.id || '', jenis: 'rutin', tanggal: tanggalAwal || toIso(new Date()), jam_mulai: '', jam_selesai: '', tempat: '', pembina_guru_id: '', pelaksana: '', materi: '', keterangan: '' },
  )
  const [alasan, setAlasan] = useState('')
  const [bentrok, setBentrok] = useState([])
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const ekskul = daftarEkskul.find((e) => String(e.id) === String(f.ekskul_id))

  // Isi bawaan dari ekstrakurikuler untuk kegiatan baru.
  function pilihEkskul(id) {
    const e = daftarEkskul.find((x) => String(x.id) === String(id))
    setF((x) => ({ ...x, ekskul_id: id, ...(!edit && e ? { jam_mulai: e.jam_mulai ?? x.jam_mulai, jam_selesai: e.jam_selesai ?? x.jam_selesai, tempat: e.tempat ?? x.tempat } : {}) }))
  }
  useEffect(() => {
    if (!edit && ekskul && !f.jam_mulai) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setF((x) => ({ ...x, jam_mulai: ekskul.jam_mulai ?? '', jam_selesai: ekskul.jam_selesai ?? '', tempat: ekskul.tempat ?? '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const jadwalBerubah = edit && (f.tanggal !== kegiatan.tanggal || f.jam_mulai !== kegiatan.jam_mulai || f.jam_selesai !== kegiatan.jam_selesai || (f.tempat || '') !== (kegiatan.tempat || ''))

  // Cek bentrok otomatis saat jadwal berubah.
  useEffect(() => {
    if (!f.ekskul_id || !f.tanggal || !f.jam_mulai || !f.jam_selesai || f.jam_selesai <= f.jam_mulai) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBentrok([])
      return
    }
    const t = setTimeout(() => {
      api
        .ekskulCekBentrok({ ekskul_id: Number(f.ekskul_id), tanggal: f.tanggal, jam_mulai: f.jam_mulai, jam_selesai: f.jam_selesai, tempat: f.tempat || null, pembina_guru_id: f.pembina_guru_id ? Number(f.pembina_guru_id) : null, kegiatan_id: kegiatan?.id })
        .then((r) => setBentrok(r.bentrok))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [f.ekskul_id, f.tanggal, f.jam_mulai, f.jam_selesai, f.tempat, f.pembina_guru_id, kegiatan?.id])

  async function kirim(abaikan = false) {
    setSimpan(true)
    setError('')
    const data = {
      ...f,
      ekskul_id: Number(f.ekskul_id),
      pembina_guru_id: f.pembina_guru_id ? Number(f.pembina_guru_id) : null,
      ...Object.fromEntries(['tempat', 'pelaksana', 'materi', 'keterangan'].map((k) => [k, f[k] || null])),
      ...(abaikan ? { abaikan_bentrok: true } : {}),
      ...(jadwalBerubah ? { alasan_perubahan: alasan } : {}),
    }
    try {
      onSaved(edit ? await api.ekskulKegiatanUpdate(kegiatan.id, data) : await api.ekskulKegiatanCreate(data))
    } catch (err) {
      if (String(err.message).startsWith('Bentrok jadwal') && window.confirm(`${err.message}\n\nTetap simpan meskipun bentrok?`)) return kirim(true)
      setError(err.message)
      setSimpan(false)
    }
  }

  const keras = bentrok.filter((b) => b.keras)
  return (
    <ModalShell title={edit ? 'Edit / Ubah Jadwal Kegiatan' : 'Tambah Kegiatan'} onClose={onClose} lebar="max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          kirim(false)
        }}
        className="space-y-4"
      >
        <Pesan error={error} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Ekstrakurikuler" className="sm:col-span-2">
            <select required disabled={edit} value={f.ekskul_id} onChange={(e) => pilihEkskul(e.target.value)} className={input}>
              <option value="">Pilih</option>
              {aktif.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jenis kegiatan">
            <select value={f.jenis} onChange={(e) => u('jenis', e.target.value)} className={input}>
              {opsi.jenis_kegiatan.map((j) => (
                <option key={j.key} value={j.key}>
                  {j.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tanggal">
            <input required type="date" value={f.tanggal} onChange={(e) => u('tanggal', e.target.value)} className={input} />
          </Field>
          <Field label="Jam mulai">
            <input required type="time" value={f.jam_mulai} onChange={(e) => u('jam_mulai', e.target.value)} className={input} />
          </Field>
          <Field label="Jam selesai">
            <input required type="time" value={f.jam_selesai} onChange={(e) => u('jam_selesai', e.target.value)} className={input} />
          </Field>
          <Field label="Tempat">
            <input value={f.tempat} onChange={(e) => u('tempat', e.target.value)} className={input} />
          </Field>
          <Field label="Pembina" hint="Kosong = pembina ekskul.">
            <select value={f.pembina_guru_id} onChange={(e) => u('pembina_guru_id', e.target.value)} className={input}>
              <option value="">{ekskul?.pembina ? `Bawaan (${ekskul.pembina})` : 'Belum ditentukan'}</option>
              {opsi.guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pelatih / narasumber">
            <input value={f.pelaksana} onChange={(e) => u('pelaksana', e.target.value)} className={input} />
          </Field>
          <Field label="Materi / agenda" className="sm:col-span-3">
            <input value={f.materi} onChange={(e) => u('materi', e.target.value)} className={input} />
          </Field>
          <Field label="Keterangan" className="sm:col-span-3">
            <textarea rows={2} value={f.keterangan} onChange={(e) => u('keterangan', e.target.value)} className={input} />
          </Field>
        </div>

        {bentrok.length > 0 && (
          <div className={`rounded-xl border px-4 py-2 space-y-1 ${keras.length ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <p className="text-xs font-bold">{keras.length ? 'Bentrok jadwal terdeteksi' : 'Peringatan'}</p>
            {bentrok.map((b, i) => (
              <p key={i} className="text-xs">
                • {b.pesan}
              </p>
            ))}
          </div>
        )}

        {jadwalBerubah && (
          <Field label="Alasan perubahan jadwal (wajib)" hint="Jadwal semula tersimpan otomatis dan tampil di detail kegiatan.">
            <input required value={alasan} onChange={(e) => setAlasan(e.target.value)} className={input} />
          </Field>
        )}

        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Batal</Btn>
          <Btn type="submit" utama disabled={simpan}>
            {simpan ? 'Menyimpan…' : jadwalBerubah ? 'Simpan Perubahan Jadwal' : 'Simpan'}
          </Btn>
        </div>
      </form>
    </ModalShell>
  )
}

function ModalRutin({ daftarEkskul, ekskulAwal, onClose, onSelesai }) {
  const kandidat = daftarEkskul.filter((e) => e.status === 'aktif' && e.hari)
  const [f, setF] = useState({ ekskul_id: ekskulAwal || kandidat[0]?.id || '', dari: toIso(new Date()), sampai: '' })
  const [pratinjau, setPratinjau] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const e = kandidat.find((x) => String(x.id) === String(f.ekskul_id))

  async function jalankan(simulasi) {
    setError('')
    setInfo('')
    try {
      const r = await api.ekskulJadwalRutin({ ekskul_id: Number(f.ekskul_id), dari: f.dari, sampai: f.sampai, simulasi })
      if (simulasi) setPratinjau(r)
      else {
        setInfo(r.message)
        setPratinjau(null)
        onSelesai()
      }
    } catch (x) {
      setError(x.message)
    }
  }

  return (
    <ModalShell title="Buat Jadwal Rutin" onClose={onClose} lebar="max-w-xl" footer={<Btn onClick={onClose}>Tutup</Btn>}>
      <Pesan error={error} info={info} />
      <p className="text-xs text-navy/50 mb-3">Membuat jadwal pertemuan rutin sesuai hari dan jam ekstrakurikuler pada rentang tanggal. Tanggal libur (menu Hari Efektif), yang sudah ada, dan yang bentrok dilewati.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Ekstrakurikuler" className="sm:col-span-3">
          <select value={f.ekskul_id} onChange={(x) => { setF((v) => ({ ...v, ekskul_id: x.target.value })); setPratinjau(null) }} className={input}>
            {kandidat.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nama} — {x.hari} {x.jam_mulai}–{x.jam_selesai}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dari tanggal">
          <input type="date" value={f.dari} onChange={(x) => { setF((v) => ({ ...v, dari: x.target.value })); setPratinjau(null) }} className={input} />
        </Field>
        <Field label="Sampai tanggal">
          <input type="date" value={f.sampai} onChange={(x) => { setF((v) => ({ ...v, sampai: x.target.value })); setPratinjau(null) }} className={input} />
        </Field>
      </div>
      {kandidat.length === 0 && <p className="text-xs text-amber-700 mt-2">Belum ada ekstrakurikuler aktif dengan hari & jam rutin. Isi di Daftar Ekstrakurikuler.</p>}
      <div className="flex gap-2 mt-3">
        <Btn disabled={!e || !f.sampai} onClick={() => jalankan(true)}>
          Pratinjau
        </Btn>
        <Btn utama disabled={!pratinjau || pratinjau.dibuat.length === 0} onClick={() => jalankan(false)}>
          Buat {pratinjau ? pratinjau.dibuat.length : ''} Jadwal
        </Btn>
      </div>
      {pratinjau && (
        <div className="mt-4 text-sm">
          <p className="font-semibold text-navy">{pratinjau.message}</p>
          {pratinjau.dibuat.length > 0 && <p className="text-xs text-navy/60 mt-1">Tanggal: {pratinjau.dibuat.map((t) => tgl(t)).join(', ')}</p>}
          {pratinjau.dilewati.length > 0 && (
            <ul className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 space-y-0.5 max-h-40 overflow-y-auto">
              {pratinjau.dilewati.map((d, i) => (
                <li key={i}>
                  {tgl(d.tanggal)}: {d.alasan}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ModalShell>
  )
}

function DetailKegiatan({ id, onClose }) {
  const [d, setD] = useState(null)
  useEffect(() => {
    api.ekskulKegiatanGet(id).then(setD).catch(() => {})
  }, [id])
  if (!d)
    return (
      <ModalShell title="Detail Kegiatan" onClose={onClose}>
        <Kosong>Memuat…</Kosong>
      </ModalShell>
    )
  return (
    <ModalShell title={`${d.ekskul.nama} — ${tgl(d.tanggal)}`} onClose={onClose} lebar="max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Badge tone={TONE_KEGIATAN[d.status]}>{d.status_label}</Badge>
        <span className="text-xs text-navy/50">{d.jenis_label}</span>
        {d.presensi_tercatat > 0 && (
          <span className="text-xs text-navy/50">
            · Hadir {d.presensi_hadir}/{d.presensi_tercatat}
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {[
          ['Hari, jam', `${d.hari}, ${d.jam_mulai}–${d.jam_selesai}`],
          ['Tempat', d.tempat ?? '-'],
          ['Pembina', d.pembina ?? '-'],
          ['Pelatih/narasumber', d.pelaksana ?? '-'],
          ['Materi', d.materi ?? '-'],
          ['Keterangan', d.keterangan ?? '-'],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] text-navy/50">{k}</p>
            <p className="font-semibold text-navy">{v}</p>
          </div>
        ))}
      </div>
      {d.status === 'dibatalkan' && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mt-3">Dibatalkan: {d.alasan_batal}</p>}
      {d.jadwal_semula && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mt-3">
          Dijadwal ulang dari {tgl(d.jadwal_semula.tanggal)} {d.jadwal_semula.jam_mulai}–{d.jadwal_semula.jam_selesai}
          {d.jadwal_semula.tempat ? ` di ${d.jadwal_semula.tempat}` : ''}. Alasan: {d.jadwal_semula.alasan}
        </p>
      )}
      <h4 className="text-xs font-bold uppercase text-navy/50 mt-5 mb-2">Riwayat perubahan</h4>
      <RiwayatList items={d.riwayat} />
    </ModalShell>
  )
}

function Kalender({ kegiatan, bulan, onTanggal, onKegiatan, onGeser }) {
  const awal = new Date(bulan.getFullYear(), bulan.getMonth(), 1)
  const mulai = new Date(awal)
  mulai.setDate(1 - ((awal.getDay() + 6) % 7))
  const sel = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(mulai)
    d.setDate(mulai.getDate() + i)
    return d
  })
  const baris = sel.slice(35).some((d) => d.getMonth() === bulan.getMonth()) ? 6 : 5
  const hariIni = toIso(new Date())
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Btn kecil onClick={() => onGeser(-1)}>
          ‹
        </Btn>
        <h3 className="text-sm font-bold text-navy w-40 text-center">
          {NAMA_BULAN[bulan.getMonth()]} {bulan.getFullYear()}
        </h3>
        <Btn kecil onClick={() => onGeser(1)}>
          ›
        </Btn>
        <Btn kecil onClick={() => onGeser(0)}>
          Hari ini
        </Btn>
      </div>
      <div className="border border-navy/10 rounded-2xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-navy/5 text-[11px] font-semibold text-navy/60 uppercase">
          {HARI_PENDEK.map((h) => (
            <div key={h} className="px-2 py-2 text-center">
              {h}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {sel.slice(0, baris * 7).map((d) => {
            const iso = toIso(d)
            const items = kegiatan.filter((k) => k.tanggal === iso)
            return (
              <div key={iso} onClick={() => onTanggal(iso)} className={`min-h-24 border-t border-l border-navy/5 p-1 cursor-pointer hover:bg-navy/[0.04] ${d.getMonth() !== bulan.getMonth() ? 'opacity-40' : ''}`}>
                <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${iso === hariIni ? 'bg-navy text-white' : 'text-navy/70'}`}>{d.getDate()}</span>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((k) => (
                    <button
                      key={k.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onKegiatan(k)
                      }}
                      className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] truncate flex items-center gap-1 bg-navy/5 hover:bg-navy/10 ${k.status === 'dibatalkan' ? 'line-through opacity-50' : ''}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${KATEGORI_TITIK[k.ekskul.kategori]}`} />
                      {k.jam_mulai} {k.ekskul.nama}
                    </button>
                  ))}
                  {items.length > 3 && <p className="text-[10px] text-navy/50 px-1">+{items.length - 3} lagi</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function EkskulKegiatanTab({ opsi, filter, daftarEkskul, onPresensi, onBerubah }) {
  const [tampil, setTampil] = useState('mendatang')
  const [f, setF] = useState({ ekskul_id: '', jenis: '', status: '', search: '' })
  const [bulan, setBulan] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [form, setForm] = useState(null)
  const [rutin, setRutin] = useState(false)
  const [detail, setDetail] = useState(null)

  const params = useMemo(() => {
    const p = { tahun_ajaran_id: filter.tahun_ajaran_id, semester: filter.semester, ...f }
    if (tampil === 'mendatang') p.waktu = 'mendatang'
    if (tampil === 'riwayat') p.waktu = 'lalu'
    if (tampil === 'kalender') {
      p.dari = toIso(new Date(bulan.getFullYear(), bulan.getMonth(), 1))
      p.sampai = toIso(new Date(bulan.getFullYear(), bulan.getMonth() + 1, 0))
    }
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v))
  }, [filter, f, tampil, bulan])

  const muat = useCallback(
    () =>
      api
        .ekskulKegiatanList(params)
        .then((r) => {
          setData(r)
          setError('')
        })
        .catch((e) => setError(e.message)),
    [params],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  const selesai = () => {
    muat()
    onBerubah?.()
  }
  const bukaEdit = (k) => api.ekskulKegiatanGet(k.id).then((d) => setForm({ kegiatan: d })).catch((e) => setError(e.message))

  const perTanggal = (data ?? []).reduce((acc, k) => {
    ;(acc[k.tanggal] ||= []).push(k)
    return acc
  }, {})

  return (
    <div>
      <Pesan error={error} info={info} />
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="flex rounded-full border border-navy/15 overflow-hidden">
          {[
            ['mendatang', 'Mendatang'],
            ['kalender', 'Kalender'],
            ['riwayat', 'Riwayat Kegiatan'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTampil(k)} className={`px-4 py-1.5 text-sm font-semibold ${tampil === k ? 'bg-navy text-white' : 'text-navy/60 hover:bg-navy/5'}`}>
              {l}
            </button>
          ))}
        </div>
        <select value={f.ekskul_id} onChange={(e) => setF((x) => ({ ...x, ekskul_id: e.target.value }))} className={selectClass}>
          <option value="">Semua ekstrakurikuler</option>
          {daftarEkskul.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
            </option>
          ))}
        </select>
        <select value={f.jenis} onChange={(e) => setF((x) => ({ ...x, jenis: e.target.value }))} className={selectClass}>
          <option value="">Semua jenis</option>
          {opsi.jenis_kegiatan.map((j) => (
            <option key={j.key} value={j.key}>
              {j.label}
            </option>
          ))}
        </select>
        <select value={f.status} onChange={(e) => setF((x) => ({ ...x, status: e.target.value }))} className={selectClass}>
          <option value="">Semua status</option>
          <option value="terjadwal">Terjadwal</option>
          <option value="terlaksana">Terlaksana</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
        <input value={f.search} onChange={(e) => setF((x) => ({ ...x, search: e.target.value }))} placeholder="Cari materi/tempat…" className={`${selectClass} w-44`} />
        <span className="flex-1" />
        <Btn onClick={() => setRutin(true)}>Buat Jadwal Rutin</Btn>
        <Btn utama onClick={() => setForm({})}>
          + Tambah Kegiatan
        </Btn>
      </div>

      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : tampil === 'kalender' ? (
        <Kalender
          kegiatan={data}
          bulan={bulan}
          onGeser={(n) => setBulan((b) => (n === 0 ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : new Date(b.getFullYear(), b.getMonth() + n, 1)))}
          onTanggal={(iso) => setForm({ tanggal: iso })}
          onKegiatan={(k) => setDetail(k.id)}
        />
      ) : data.length === 0 ? (
        <Kosong>{tampil === 'riwayat' ? 'Belum ada kegiatan yang lewat.' : 'Belum ada kegiatan mendatang. Tambahkan atau buat jadwal rutin.'}</Kosong>
      ) : (
        <div className="space-y-4">
          {Object.entries(perTanggal).map(([tanggal, items]) => (
            <div key={tanggal}>
              <h3 className="text-sm font-bold text-navy mb-2">
                {items[0].hari}, {tgl(tanggal)}
              </h3>
              <div className="bg-white border border-navy/10 rounded-2xl divide-y divide-navy/5">
                {items.map((k) => (
                  <div key={k.id} className="px-4 py-3 flex items-start gap-3 flex-wrap">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${KATEGORI_TITIK[k.ekskul.kategori]}`} />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setDetail(k.id)} className="text-left">
                        <p className={`font-semibold text-navy hover:underline ${k.status === 'dibatalkan' ? 'line-through opacity-60' : ''}`}>{k.ekskul.nama}</p>
                      </button>
                      <p className="text-xs text-navy/60">
                        {k.jam_mulai}–{k.jam_selesai} · {k.jenis_label}
                        {k.tempat ? ` · ${k.tempat}` : ''}
                        {k.materi ? ` · ${k.materi}` : ''}
                      </p>
                      <p className="text-[11px] text-navy/40">
                        {k.pembina ? `Pembina: ${k.pembina}` : ''}
                        {k.jadwal_semula ? ' · dijadwal ulang' : ''}
                        {k.presensi_tercatat ? ` · hadir ${k.presensi_hadir}/${k.presensi_tercatat}` : ''}
                      </p>
                    </div>
                    <Badge tone={TONE_KEGIATAN[k.status]}>{k.status_label}</Badge>
                    <div className="flex gap-1.5 flex-wrap">
                      {k.status !== 'dibatalkan' && (
                        <Btn kecil onClick={() => onPresensi(k.id)}>
                          Presensi
                        </Btn>
                      )}
                      {k.status !== 'dibatalkan' && (
                        <Btn kecil onClick={() => bukaEdit(k)}>
                          {k.presensi_tercatat ? 'Edit' : 'Ubah Jadwal'}
                        </Btn>
                      )}
                      {k.status === 'terjadwal' && (
                        <Btn
                          kecil
                          onClick={async () => {
                            const alasan = window.prompt('Alasan membatalkan kegiatan:')
                            if (!alasan) return
                            try {
                              await api.ekskulKegiatanBatal(k.id, alasan)
                              setInfo('Kegiatan dibatalkan.')
                              selesai()
                            } catch (x) {
                              setError(x.message)
                            }
                          }}
                        >
                          Batalkan
                        </Btn>
                      )}
                      {!k.presensi_tercatat && (
                        <Btn
                          kecil
                          bahaya
                          onClick={async () => {
                            if (!window.confirm('Hapus kegiatan ini?')) return
                            try {
                              await api.ekskulKegiatanDelete(k.id)
                              selesai()
                            } catch (x) {
                              setError(x.message)
                            }
                          }}
                        >
                          Hapus
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <FormKegiatan
          opsi={opsi}
          daftarEkskul={daftarEkskul}
          kegiatan={form.kegiatan}
          tanggalAwal={form.tanggal}
          ekskulAwal={f.ekskul_id}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            setInfo('Kegiatan disimpan.')
            selesai()
          }}
        />
      )}
      {rutin && <ModalRutin daftarEkskul={daftarEkskul} ekskulAwal={f.ekskul_id} onClose={() => setRutin(false)} onSelesai={selesai} />}
      {detail && <DetailKegiatan id={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
