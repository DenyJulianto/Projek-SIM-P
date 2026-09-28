import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pagination, Pesan } from './PerpusUI'
import { inputClass, LABEL_JENIS_ANGGOTA, selectClass, tgl, TONE_STATUS_ANGGOTA, TONE_STATUS_PEMINJAMAN } from './perpusKonstanta'

export default function PerpusAnggotaTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [jenis, setJenis] = useState('')
  const [status, setStatus] = useState('')
  const [showAktivasi, setShowAktivasi] = useState(false)
  const [detailId, setDetailId] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (jenis) params.jenis_anggota = jenis
    if (status) params.status = status
    api.perpusListAnggota(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, jenis, status])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Anggota Perpustakaan</h2>
          <p className="text-xs text-navy/50 mt-0.5">Anggota diaktivasi dari Data Siswa, Data Guru, atau Data Pegawai yang sudah ada — bukan input manual.</p>
        </div>
        <Btn utama onClick={() => setShowAktivasi(true)}>+ Aktivasi Anggota</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari nama / nomor kartu…"
          className={`${selectClass} w-56`}
        />
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Jenis</option>
          <option value="siswa">Siswa</option>
          <option value="guru">Guru</option>
          <option value="pegawai">Pegawai</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nomor Kartu</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">NIS / NISN / NIP</th>
              <th className="px-4 py-3">Kelas / Unit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada anggota.</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-navy/70">{a.nomor_kartu}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{a.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{LABEL_JENIS_ANGGOTA[a.jenis_anggota]}</td>
                  <td className="px-4 py-3 text-navy/70">{a.nis_nisn_nip || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{a.kelas_unit || '-'}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_ANGGOTA[a.status]}>{a.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(a.id)} className="text-xs font-semibold text-navy-light hover:underline">Detail</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showAktivasi && (
        <AktivasiAnggotaModal
          onClose={() => setShowAktivasi(false)}
          onSaved={() => {
            setShowAktivasi(false)
            load()
          }}
        />
      )}
      {detailId && <AnggotaDetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}

function AktivasiAnggotaModal({ onClose, onSaved }) {
  const [jenis, setJenis] = useState('siswa')
  const [search, setSearch] = useState('')
  const [calon, setCalon] = useState(null)
  const [pilih, setPilih] = useState(null)
  const [nip, setNip] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPilih(null)
    const timer = setTimeout(() => {
      api.perpusCalonAnggota(jenis, search).then(setCalon).catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(timer)
  }, [jenis, search])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const kolom = { siswa: 'siswa_id', guru: 'guru_id', pegawai: 'user_id' }[jenis]
      await api.perpusAktivasiAnggota({ jenis_anggota: jenis, [kolom]: pilih.id, nip_pegawai: jenis === 'pegawai' ? nip : undefined })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Aktivasi Anggota Perpustakaan"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !pilih} onClick={submit}>{saving ? 'Menyimpan...' : 'Aktivasi'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="flex gap-2 mb-3">
        {['siswa', 'guru', 'pegawai'].map((j) => (
          <button
            key={j}
            onClick={() => setJenis(j)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${jenis === j ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60'}`}
          >
            {LABEL_JENIS_ANGGOTA[j]}
          </button>
        ))}
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Cari nama ${LABEL_JENIS_ANGGOTA[jenis].toLowerCase()}…`}
        className={`${inputClass} mb-3`}
      />
      <div className="border border-navy/10 rounded-lg max-h-56 overflow-y-auto mb-3">
        {!calon ? (
          <p className="text-xs text-navy/40 p-3">Memuat...</p>
        ) : calon.length === 0 ? (
          <p className="text-xs text-navy/40 p-3">Semua {LABEL_JENIS_ANGGOTA[jenis].toLowerCase()} sudah menjadi anggota, atau tidak ditemukan.</p>
        ) : (
          calon.map((c) => (
            <label key={c.id} className="flex items-center gap-3 px-3 py-2 border-b border-navy/5 last:border-0 text-sm cursor-pointer hover:bg-navy/5">
              <input type="radio" name="calon" checked={pilih?.id === c.id} onChange={() => setPilih(c)} />
              <span className="font-medium text-navy">{c.nama}</span>
              <span className="text-xs text-navy/40">{c.identitas} {c.keterangan ? `· ${c.keterangan}` : ''}</span>
            </label>
          ))
        )}
      </div>
      {jenis === 'pegawai' && (
        <Field label="NIP (opsional)">
          <input value={nip} onChange={(e) => setNip(e.target.value)} className={inputClass} />
        </Field>
      )}
    </ModalShell>
  )
}

function AnggotaDetailModal({ id, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.perpusGetAnggota(id).then(setData).catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  async function ubahStatus(status) {
    try {
      await api.perpusUpdateStatusAnggota(id, status)
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!data) {
    return (
      <ModalShell title="Detail Anggota" onClose={onClose}>
        <Pesan error={error} />
        <Kosong>Memuat...</Kosong>
      </ModalShell>
    )
  }

  const a = data.anggota

  return (
    <ModalShell
      title={a.nama}
      onClose={onClose}
      footer={
        <>
          {a.status === 'aktif' ? (
            <Btn bahaya onClick={() => ubahStatus('nonaktif')}>Nonaktifkan</Btn>
          ) : (
            <Btn utama onClick={() => ubahStatus('aktif')}>Aktifkan Kembali</Btn>
          )}
          <Btn onClick={() => api.perpusCetakKartuAnggota(a.id, a.nomor_kartu).catch((e) => setError(e.message))}>Cetak Kartu Anggota</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-5">
        <p><span className="text-navy/50">Nomor Kartu:</span> {a.nomor_kartu}</p>
        <p><span className="text-navy/50">Jenis:</span> {LABEL_JENIS_ANGGOTA[a.jenis_anggota]}</p>
        <p><span className="text-navy/50">NIS/NISN/NIP:</span> {a.nis_nisn_nip || '-'}</p>
        <p><span className="text-navy/50">Kelas/Unit:</span> {a.kelas_unit || '-'}</p>
        <p><span className="text-navy/50">Terdaftar sejak:</span> {tgl(a.tanggal_terdaftar)}</p>
        <p><span className="text-navy/50">Status:</span> <Badge tone={TONE_STATUS_ANGGOTA[a.status]}>{a.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge></p>
      </div>

      <h3 className="text-sm font-bold text-navy mb-2">Riwayat Peminjaman</h3>
      {data.riwayat_peminjaman.length === 0 ? (
        <Kosong>Belum pernah meminjam.</Kosong>
      ) : (
        <div className="border border-navy/10 rounded-lg divide-y divide-navy/5 max-h-64 overflow-y-auto">
          {data.riwayat_peminjaman.map((p) => (
            <div key={p.id} className="px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy">{p.nomor_transaksi}</span>
                <Badge tone={TONE_STATUS_PEMINJAMAN[p.status]}>{p.status.replaceAll('_', ' ')}</Badge>
              </div>
              <p className="text-xs text-navy/50">{tgl(p.tanggal_pinjam)} — jatuh tempo {tgl(p.tanggal_jatuh_tempo)}</p>
              <p className="text-xs text-navy/60">{p.item.map((it) => it.eksemplar.buku.judul).join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}
