import { useEffect, useState } from 'react'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan } from '../../components/PpdbUI'
import { selectClass, tgl, waktu } from '../../components/ppdbKonstanta'
import { api } from '../../lib/api'
import { Halaman } from './WakasekUI'

const TONE = { menunggu_persetujuan: 'kuning', disetujui: 'hijau', ditolak: 'merah', dibatalkan: 'abu' }
const JUDUL = {
  menunggu: ['Menunggu Persetujuan', 'Pengajuan yang menunggu keputusan Anda. Keputusan memakai aturan yang sama dengan halaman Perubahan Jadwal dan Guru Pengganti (termasuk cek bentrok).'],
  pengajuan: ['Pengajuan', 'Seluruh pengajuan perubahan jadwal dan guru pengganti beserta statusnya.'],
  riwayat: ['Riwayat Persetujuan', 'Pengajuan yang sudah diputuskan (disetujui, ditolak, atau dibatalkan) beserta pemutus dan catatannya.'],
}

/** Antrean persetujuan gabungan. `mode`: menunggu | pengajuan | riwayat. */
export default function PersetujuanView({ mode, onBack }) {
  const [f, setF] = useState({ jenis: '', status: '', search: '' })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [putus, setPutus] = useState(null)
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    let batal = false
    const t = setTimeout(() => {
      api
        .wakPersetujuan({ mode, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')) })
        .then((r) => !batal && (setData(r), setError('')))
        .catch((e) => !batal && setError(e.message))
    }, 250)
    return () => {
      batal = true
      clearTimeout(t)
    }
  }, [mode, f, versi])

  const [judul, deskripsi] = JUDUL[mode]
  const statusOpsi = data?.status.filter((s) => (mode === 'riwayat' ? s.key !== 'menunggu_persetujuan' : true)) ?? []

  return (
    <Halaman judul={judul} deskripsi={deskripsi} onBack={onBack}>
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <Field label="Jenis">
          <select value={f.jenis} onChange={(e) => setF({ ...f, jenis: e.target.value })} className={selectClass}>
            <option value="">Semua</option>
            {data?.jenis.map((j) => (
              <option key={j.key} value={j.key}>
                {j.label}
              </option>
            ))}
          </select>
        </Field>
        {mode !== 'menunggu' && (
          <Field label="Status">
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={selectClass}>
              <option value="">Semua</option>
              {statusOpsi.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Pencarian">
          <input value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} placeholder="Mapel, kelas, guru, alasan…" className={`${selectClass} w-56`} />
        </Field>
      </div>
      <Pesan error={error} info={info} />
      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : data.daftar.length === 0 ? (
        <Kosong>{mode === 'menunggu' ? 'Tidak ada pengajuan yang menunggu persetujuan.' : 'Tidak ada data yang cocok.'}</Kosong>
      ) : (
        <div className="space-y-3">
          {data.daftar.map((i) => (
            <div key={i.kunci} className="bg-white border border-navy/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="biru">{i.jenis_label}</Badge>
                <span className="text-sm font-extrabold text-navy">{i.judul}</span>
                <Badge tone={TONE[i.status]}>{i.status_label}</Badge>
                <span className="flex-1" />
                {i.status === 'menunggu_persetujuan' && (
                  <>
                    <Btn kecil bahaya onClick={() => setPutus({ item: i, aksi: 'tolak' })}>
                      Tolak
                    </Btn>
                    <Btn kecil utama onClick={() => setPutus({ item: i, aksi: 'setujui' })}>
                      Setujui
                    </Btn>
                  </>
                )}
              </div>
              <p className="text-sm text-navy mt-1.5">{i.ringkas}</p>
              <p className="text-xs text-navy/60 mt-1">
                Berlaku {tgl(i.tanggal_efektif)} · Alasan: {i.alasan || '-'}
                {i.catatan ? ` · Catatan: ${i.catatan}` : ''}
              </p>
              <p className="text-[11px] text-navy/40 mt-1">
                Diajukan oleh {i.diajukan_oleh || '-'} · {waktu(i.diajukan_pada)}
              </p>
              {i.diputuskan_oleh && (
                <p className="text-[11px] text-navy/60 mt-1">
                  Diputuskan oleh <span className="font-semibold">{i.diputuskan_oleh}</span> · {waktu(i.tanggal_keputusan)}
                  {i.catatan_keputusan ? ` · “${i.catatan_keputusan}”` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {putus && (
        <ModalKeputusan
          {...putus}
          onClose={() => setPutus(null)}
          onSelesai={(pesan) => {
            setPutus(null)
            setInfo(pesan)
            setVersi((v) => v + 1)
          }}
        />
      )}
    </Halaman>
  )
}

function ModalKeputusan({ item, aksi, onClose, onSelesai }) {
  const [catatan, setCatatan] = useState('')
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const setuju = aksi === 'setujui'

  async function kirim() {
    if (!setuju && catatan.trim().length < 3) {
      setError('Alasan penolakan wajib diisi.')
      return
    }
    setSimpan(true)
    try {
      const data = { aksi, ...(catatan.trim() ? { catatan_keputusan: catatan.trim() } : {}) }
      await (item.jenis === 'perubahan_jadwal' ? api.keputusanPerubahanJadwal(item.id, data) : api.keputusanGuruPengganti(item.id, data))
      onSelesai(`${item.jenis_label} ${setuju ? 'disetujui' : 'ditolak'}.`)
    } catch (e) {
      setError(e.message)
      setSimpan(false)
    }
  }

  return (
    <ModalShell
      title={`${setuju ? 'Setujui' : 'Tolak'} ${item.jenis_label}`}
      onClose={onClose}
      lebar="max-w-md"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama={setuju} bahaya={!setuju} disabled={simpan} onClick={kirim}>
            {simpan ? 'Menyimpan…' : setuju ? 'Setujui' : 'Tolak'}
          </Btn>
        </>
      }
    >
      <p className="text-sm font-semibold text-navy">{item.judul}</p>
      <p className="text-xs text-navy/60 mb-3">{item.ringkas}</p>
      <Pesan error={error} />
      <Field label={setuju ? 'Catatan (opsional)' : 'Alasan penolakan'} hint="Tercatat bersama nama Anda dan waktu keputusan.">
        <textarea rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white" />
      </Field>
    </ModalShell>
  )
}
