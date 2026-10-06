import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

const TAB = [
  ['menunggu', 'Menunggu Konfirmasi'],
  ['disetujui', 'Disetujui'],
  ['ditolak', 'Ditolak'],
]

const JENIS = [
  ['siswa', 'Siswa'],
  ['pegawai', 'Pendidik & Tendik'],
]

const PERAN_BUKAN_STAF = ['Super Admin', 'Siswa', 'Orang Tua']
const PERAN_BAWAAN = { Guru: ['Guru Mata Pelajaran'], 'Tenaga Kependidikan': ['Tata Usaha'] }

/**
 * Konfirmasi pendaftaran mandiri. Siswa: admin memilih kelas saat menyetujui,
 * lalu data siswa + akun siswa & orang tua dibuat. Pegawai: menyetujui
 * membuat akun dan mengirim email untuk membuat password. Menolak memberi
 * tahu pendaftar lewat email (bila ada) beserta alasannya.
 */
export default function KonfirmasiPengguna({ onBack, onChanged }) {
  const [jenis, setJenis] = useState('siswa')
  const [jumlah, setJumlah] = useState({ siswa: 0, pegawai: 0 })

  const muatJumlah = useCallback(() => {
    api.listPendaftaranSiswa('menunggu').then((r) => setJumlah((j) => ({ ...j, siswa: r.menunggu }))).catch(() => {})
    api.listPendaftaranPegawai('menunggu').then((r) => setJumlah((j) => ({ ...j, pegawai: r.menunggu }))).catch(() => {})
  }, [])

  useEffect(() => {
    muatJumlah()
  }, [muatJumlah])

  function setelahBerubah() {
    muatJumlah()
    onChanged?.()
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <UserCheckIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Konfirmasi Pengguna</h1>
          <p className="text-sm text-navy/50">
            Tinjau pendaftaran siswa serta pendidik &amp; tenaga kependidikan sebelum akunnya dibuat.
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-full bg-navy/5 p-1 mb-5">
        {JENIS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setJenis(k)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              jenis === k ? 'bg-emerald-600 text-white shadow-sm' : 'text-navy/60 hover:text-navy'
            }`}
          >
            {l}
            {jumlah[k] > 0 && (
              <span
                className={`text-[11px] rounded-full px-1.5 ${jenis === k ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'}`}
              >
                {jumlah[k]}
              </span>
            )}
          </button>
        ))}
      </div>

      {jenis === 'siswa' ? <PendaftaranSiswaPanel onChanged={setelahBerubah} /> : <PendaftaranPegawaiPanel onChanged={setelahBerubah} />}
    </div>
  )
}

/** Tab status + muat ulang daftar, dipakai kedua jenis pendaftaran. */
function useDaftarPendaftaran(muatFn) {
  const [tab, setTab] = useState('menunggu')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const muat = useCallback(() => {
    muatFn(tab).then(setData).catch((err) => setError(err.message))
  }, [tab, muatFn])

  useEffect(() => {
    muat()
  }, [muat])

  function gantiTab(k) {
    if (k === tab) return
    setData(null)
    setTab(k)
  }

  return { tab, gantiTab, data, muat, error, setError, daftar: data?.data?.data ?? [] }
}

function TabStatus({ tab, onTab, menunggu }) {
  return (
    <div className="flex gap-1 mb-5 border-b border-navy/10">
      {TAB.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onTab(k)}
          className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${
            tab === k ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-navy/50 hover:text-navy'
          }`}
        >
          {l}
          {k === 'menunggu' && menunggu > 0 && (
            <span className="ml-1.5 text-[11px] bg-amber-100 text-amber-700 rounded-full px-1.5">{menunggu}</span>
          )}
        </button>
      ))}
    </div>
  )
}

function StatusDaftar({ data, kosong, tab }) {
  if (!data) return <p className="text-sm text-navy/40">Memuat…</p>
  if (kosong) {
    return (
      <div className="bg-white rounded-2xl border border-navy/10 px-6 py-12 text-center text-sm text-navy/40">
        {tab === 'menunggu' ? 'Tidak ada pendaftaran yang menunggu konfirmasi.' : 'Belum ada data.'}
      </div>
    )
  }
  return null
}

function Pesan({ error, info }) {
  return (
    <>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}
      {info && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">{info}</p>}
    </>
  )
}

function InfoDiproses({ p }) {
  if (p.status === 'menunggu') return null
  return (
    <p className="text-[11px] text-navy/40 mt-3">
      Diproses oleh {p.pemroses?.name ?? '-'} pada {p.diproses_at ? new Date(p.diproses_at).toLocaleString('id-ID') : '-'}
    </p>
  )
}

function PanelTolak({ aksi, setAksi, busy, onTolak, catatan }) {
  return (
    <div className="mt-4 bg-red-50/60 border border-red-100 rounded-xl p-4 space-y-2">
      <textarea
        value={aksi.alasan}
        onChange={(e) => setAksi((a) => ({ ...a, alasan: e.target.value }))}
        rows={2}
        maxLength={500}
        placeholder={catatan}
        className="w-full border border-red-200 rounded-lg px-3 py-2 text-xs bg-white"
      />
      <div className="flex justify-end gap-3">
        <button onClick={() => setAksi(null)} className="text-xs text-navy/50 hover:text-navy">Batal</button>
        <button
          disabled={busy || !aksi.alasan.trim()}
          onClick={onTolak}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-full disabled:opacity-50"
        >
          {busy ? 'Memproses…' : 'Tolak pendaftaran'}
        </button>
      </div>
    </div>
  )
}

function TombolAksi({ onSetujui, onTolak }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSetujui} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-full">
        Setujui
      </button>
      <button onClick={onTolak} className="border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-full">
        Tolak
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Siswa                                                               */
/* ------------------------------------------------------------------ */

function PendaftaranSiswaPanel({ onChanged }) {
  const { tab, gantiTab, data, muat, error, setError, daftar } = useDaftarPendaftaran(api.listPendaftaranSiswa)
  const [kelasList, setKelasList] = useState([])
  const [aksi, setAksi] = useState(null)
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [kredensial, setKredensial] = useState(null)

  useEffect(() => {
    api
      .listKelasAll()
      .then((r) => setKelasList((r.data || []).filter((k) => k.status !== 'nonaktif')))
      .catch(() => {})
  }, [])

  async function jalankan(fn, { simpanKredensial = false } = {}) {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const res = await fn()
      setInfo(res.message)
      if (simpanKredensial) setKredensial(res)
      setAksi(null)
      muat()
      onChanged?.()
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <TabStatus tab={tab} onTab={(k) => { setAksi(null); gantiTab(k) }} menunggu={data?.menunggu} />
      <Pesan error={error} info={info} />
      {kredensial && <KartuKredensial hasil={kredensial} onTutup={() => setKredensial(null)} />}
      <StatusDaftar data={data} kosong={data && daftar.length === 0} tab={tab} />

      <div className="space-y-3">
        {daftar.map((p) => (
          <div key={p.id} className="bg-white border border-navy/10 rounded-2xl p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy text-base">{p.nama_lengkap}</p>
                <p className="text-xs text-navy/50 mt-0.5">
                  Siswa · NISN {p.nisn} · mendaftar {new Date(p.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              {tab === 'menunggu' && aksi?.id !== p.id && (
                <TombolAksi
                  onSetujui={() => setAksi({ id: p.id, jenis: 'setujui', kelas_id: '', nis: p.nis || '', buat_akun_ortu: true })}
                  onTolak={() => setAksi({ id: p.id, jenis: 'tolak', alasan: '' })}
                />
              )}
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 mt-4 text-xs">
              <Baris l="NISN" v={p.nisn} />
              <Baris l="NIS" v={p.nis} />
              <Baris l="Tanggal lahir" v={p.tanggal_lahir ? new Date(`${p.tanggal_lahir}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'long' }) : ''} />
              <Baris l="Jenis kelamin" v={p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
              <Baris l="Email" v={p.email} />
              <Baris l="No. HP siswa" v={p.no_hp} />
              <Baris l="Orang tua/wali" v={p.nama_wali} />
              <Baris l="No. HP orang tua" v={p.no_hp_wali} />
              {p.status === 'disetujui' && <Baris l="Kelas" v={p.kelas?.nama_kelas} />}
            </dl>

            {(p.nisn_dipakai || p.nis_dipakai) && (
              <p className="text-xs rounded-lg px-3 py-2 mt-3 border text-red-700 bg-red-50 border-red-200">
                {p.nisn_dipakai && `NISN ini sudah terdaftar sebagai siswa "${p.nisn_dipakai}", jadi pendaftaran ini tidak bisa disetujui. `}
                {p.nis_dipakai && `NIS ${p.nis} sudah dipakai siswa "${p.nis_dipakai}"; isi NIS lain saat menyetujui.`}
              </p>
            )}
            {p.status === 'ditolak' && <p className="text-xs text-red-600 mt-3">Alasan ditolak: {p.alasan_penolakan}</p>}
            <InfoDiproses p={p} />

            {aksi?.id === p.id && aksi.jenis === 'setujui' && (
              <div className="mt-4 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-semibold text-navy/70 mb-1">
                      Kelas <span className="text-red-500">*</span>
                    </span>
                    <select
                      value={aksi.kelas_id}
                      onChange={(e) => setAksi((a) => ({ ...a, kelas_id: e.target.value }))}
                      className="w-full border border-navy/15 rounded-lg px-2 py-2 text-xs bg-white"
                    >
                      <option value="">Pilih kelas…</option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas}
                          {k.tingkat ? ` · ${k.tingkat}` : ''}
                        </option>
                      ))}
                    </select>
                    {kelasList.length === 0 && (
                      <span className="block text-[11px] text-amber-700 mt-1">Belum ada kelas aktif. Tambahkan kelas terlebih dahulu.</span>
                    )}
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-navy/70 mb-1">NIS</span>
                    <input
                      inputMode="numeric"
                      value={aksi.nis}
                      onChange={(e) => setAksi((a) => ({ ...a, nis: e.target.value.replace(/\D/g, '').slice(0, 20) }))}
                      placeholder="Kosongkan untuk memakai NISN"
                      className="w-full border border-navy/15 rounded-lg px-2 py-2 text-xs bg-white"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-navy">
                  <input
                    type="checkbox"
                    checked={aksi.buat_akun_ortu}
                    onChange={(e) => setAksi((a) => ({ ...a, buat_akun_ortu: e.target.checked }))}
                  />
                  Buat juga akun orang tua/wali ({p.nama_wali})
                </label>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setAksi(null)} className="text-xs text-navy/50 hover:text-navy">Batal</button>
                  <button
                    disabled={busy || !aksi.kelas_id}
                    onClick={() =>
                      jalankan(
                        () =>
                          api.setujuiPendaftaranSiswa(p.id, {
                            kelas_id: Number(aksi.kelas_id),
                            nis: aksi.nis || null,
                            buat_akun_ortu: aksi.buat_akun_ortu,
                          }),
                        { simpanKredensial: true }
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-full disabled:opacity-50"
                  >
                    {busy ? 'Memproses…' : 'Setujui & buat akun'}
                  </button>
                </div>
              </div>
            )}

            {aksi?.id === p.id && aksi.jenis === 'tolak' && (
              <PanelTolak
                aksi={aksi}
                setAksi={setAksi}
                busy={busy}
                catatan={p.email ? 'Alasan penolakan (dikirim ke email pendaftar)' : 'Alasan penolakan (pendaftar tidak mengisi email)'}
                onTolak={() => jalankan(() => api.tolakPendaftaranSiswa(p.id, aksi.alasan.trim()))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Informasi login hasil persetujuan — password sementara hanya ditampilkan sekali. */
function KartuKredensial({ hasil, onTutup }) {
  const [tersalin, setTersalin] = useState(false)
  const teks = [
    `Kelas: ${hasil.kelas}`,
    ...hasil.kredensial.map((k) => `${k.jenis} (${k.nama}) — username: ${k.username}, password sementara: ${k.password}`),
    'Password wajib diganti saat login pertama.',
  ].join('\n')

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks)
      setTersalin(true)
    } catch {
      setTersalin(false)
    }
  }

  return (
    <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 mb-5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-navy">Informasi login akun baru</p>
          <p className="text-xs text-navy/50 mt-0.5">
            Serahkan kepada siswa dan orang tua/wali. Password sementara <strong>hanya ditampilkan sekali ini</strong> dan wajib
            diganti saat login pertama.
          </p>
        </div>
        <button onClick={onTutup} className="text-xs text-navy/50 hover:text-navy shrink-0">Tutup</button>
      </div>
      <table className="w-full mt-4 text-xs">
        <thead>
          <tr className="text-left text-navy/40">
            <th className="py-1.5 font-semibold">Akun</th>
            <th className="py-1.5 font-semibold">Nama</th>
            <th className="py-1.5 font-semibold">Username</th>
            <th className="py-1.5 font-semibold">Password sementara</th>
          </tr>
        </thead>
        <tbody>
          {hasil.kredensial.map((k) => (
            <tr key={k.username} className="border-t border-navy/5">
              <td className="py-2 text-navy/70">{k.jenis}</td>
              <td className="py-2 text-navy">{k.nama}</td>
              <td className="py-2 font-mono text-navy">{k.username}</td>
              <td className="py-2 font-mono font-bold text-navy">{k.password}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="text-[11px] text-navy/50">
          {hasil.email
            ? hasil.email_terkirim
              ? `Informasi login siswa juga sudah dikirim ke ${hasil.email}.`
              : `Email ke ${hasil.email} gagal terkirim saat ini; serahkan informasi ini secara langsung.`
            : 'Pendaftar tidak mengisi email; serahkan informasi ini secara langsung.'}
        </p>
        <button
          onClick={salin}
          className="text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full px-4 py-1.5"
        >
          {tersalin ? 'Tersalin ✓' : 'Salin'}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pendidik & tenaga kependidikan                                      */
/* ------------------------------------------------------------------ */

function PendaftaranPegawaiPanel({ onChanged }) {
  const { tab, gantiTab, data, muat, error, setError, daftar } = useDaftarPendaftaran(api.listPendaftaranPegawai)
  const [peranStaf, setPeranStaf] = useState([])
  const [aksi, setAksi] = useState(null)
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .listRoles()
      .then((roles) => setPeranStaf(roles.map((r) => r.name).filter((n) => !PERAN_BUKAN_STAF.includes(n))))
      .catch(() => {})
  }, [])

  async function jalankan(fn) {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const res = await fn()
      setInfo(res.message)
      setAksi(null)
      muat()
      onChanged?.()
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <TabStatus tab={tab} onTab={(k) => { setAksi(null); gantiTab(k) }} menunggu={data?.menunggu} />
      <Pesan error={error} info={info} />
      <StatusDaftar data={data} kosong={data && daftar.length === 0} tab={tab} />

      <div className="space-y-3">
        {daftar.map((p) => (
          <div key={p.id} className="bg-white border border-navy/10 rounded-2xl p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy text-base">{p.nama_lengkap}</p>
                <p className="text-xs text-navy/50 mt-0.5">
                  {p.jenis_pegawai} · {p.status_kepegawaian} · mendaftar {new Date(p.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              {tab === 'menunggu' && aksi?.id !== p.id && (
                <TombolAksi
                  onSetujui={() => setAksi({ id: p.id, jenis: 'setujui', roles: PERAN_BAWAAN[p.jenis_pegawai] ?? [], jenis_kelamin: '' })}
                  onTolak={() => setAksi({ id: p.id, jenis: 'tolak', alasan: '' })}
                />
              )}
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 mt-4 text-xs">
              <Baris l="Email" v={p.email} />
              <Baris l="No. HP/WA" v={p.no_hp} />
              {p.nip && <Baris l="NIP" v={p.nip} />}
              {p.nuptk && <Baris l="NUPTK" v={p.nuptk} />}
              {p.nik && <Baris l="NIK" v={p.nik} />}
              <Baris l="Jabatan diajukan" v={p.jabatan} />
              {p.jenis_pegawai === 'Guru' && <Baris l="Mata pelajaran" v={p.mata_pelajaran} />}
            </dl>
            {p.akun_terdaftar && (
              <p
                className={`text-xs rounded-lg px-3 py-2 mt-3 border ${
                  p.akun_terdaftar.punya_peran
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                {p.akun_terdaftar.punya_peran
                  ? `Email ini sudah dipakai akun aktif "${p.akun_terdaftar.name}", jadi pendaftaran ini tidak bisa disetujui. Tolak atau hubungi pendaftar.`
                  : `Email ini sudah punya akun lama tanpa peran ("${p.akun_terdaftar.name}"). Jika disetujui, akun itu dipakai ulang: nama, peran, dan password diperbarui lewat undangan.`}
              </p>
            )}
            {p.catatan && <p className="text-xs text-navy/70 bg-navy/5 rounded-lg px-3 py-2 mt-3 whitespace-pre-line">Catatan: {p.catatan}</p>}
            {p.status === 'ditolak' && <p className="text-xs text-red-600 mt-3">Alasan ditolak: {p.alasan_penolakan}</p>}
            <InfoDiproses p={p} />

            {aksi?.id === p.id && aksi.jenis === 'setujui' && (
              <div className="mt-4 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-navy/70 mb-2">Peran akun</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {peranStaf.map((r) => (
                      <label key={r} className="flex items-center gap-1.5 text-xs text-navy">
                        <input
                          type="checkbox"
                          checked={aksi.roles.includes(r)}
                          onChange={(e) =>
                            setAksi((a) => ({ ...a, roles: e.target.checked ? [...a.roles, r] : a.roles.filter((x) => x !== r) }))
                          }
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-semibold text-navy/70">Jenis kelamin</label>
                  <select
                    value={aksi.jenis_kelamin}
                    onChange={(e) => setAksi((a) => ({ ...a, jenis_kelamin: e.target.value }))}
                    className="border border-navy/15 rounded-lg px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="">Pilih…</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  <div className="ml-auto flex gap-3">
                    <button onClick={() => setAksi(null)} className="text-xs text-navy/50 hover:text-navy">Batal</button>
                    <button
                      disabled={busy || aksi.roles.length === 0 || !aksi.jenis_kelamin}
                      onClick={() => jalankan(() => api.setujuiPendaftaranPegawai(p.id, { roles: aksi.roles, jenis_kelamin: aksi.jenis_kelamin }))}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-full disabled:opacity-50"
                    >
                      {busy ? 'Memproses…' : 'Setujui & kirim email'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {aksi?.id === p.id && aksi.jenis === 'tolak' && (
              <PanelTolak
                aksi={aksi}
                setAksi={setAksi}
                busy={busy}
                catatan="Alasan penolakan (dikirim ke pendaftar lewat email)"
                onTolak={() => jalankan(() => api.tolakPendaftaranPegawai(p.id, aksi.alasan.trim()))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Baris({ l, v }) {
  return (
    <div className="flex gap-2">
      <dt className="text-navy/40 w-32 shrink-0">{l}</dt>
      <dd className="text-navy break-all">{v || '-'}</dd>
    </div>
  )
}

function UserCheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6 1.7 0 3.2.5 4.3 1.4" />
      <path d="m15.5 18 2 2 4-4.5" />
    </svg>
  )
}
