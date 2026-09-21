import { useEffect, useState } from 'react'
import { BASE_URL, api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { TONE_STATUS_PELANGGARAN, TONE_STATUS_TL, TONE_TINGKAT_PELANGGARAN, selectClass, tgl } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'
const LABEL_EVENT = { created: 'Dicatat', updated: 'Diubah', status: 'Status', ekspor: 'Ekspor' }
const th = 'px-3 py-2 text-left text-[11px] uppercase text-navy/50 font-semibold whitespace-nowrap'
const td = 'px-3 py-2.5 text-sm text-navy align-top'

function Saring({ children, onExport, sibuk }) {
  return (
    <div className="flex items-end gap-3 flex-wrap mb-3">
      {children}
      <span className="flex-1" />
      <Btn kecil disabled={!!sibuk} onClick={() => onExport('xlsx')}>
        {sibuk === 'xlsx' ? 'Menyiapkan…' : 'Export Excel'}
      </Btn>
      <Btn kecil disabled={!!sibuk} onClick={() => onExport('pdf')}>
        {sibuk === 'pdf' ? 'Menyiapkan…' : 'Export PDF'}
      </Btn>
    </div>
  )
}

const Pilih = ({ label, value, onChange, daftar, semua = 'Semua' }) => (
  <Field label={label}>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">{semua}</option>
      {daftar.map((d) => (
        <option key={d.key ?? d} value={d.key ?? d}>
          {d.label ?? d}
        </option>
      ))}
    </select>
  </Field>
)

const Cari = ({ value, onChange, placeholder }) => (
  <Field label="Pencarian">
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${selectClass} w-56`} />
  </Field>
)

function Rincian({ baris, judul, onClose, children }) {
  return (
    <ModalShell title={judul} onClose={onClose} lebar="max-w-xl">
      <dl className="space-y-2">
        {baris
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase font-semibold text-navy/40">{k}</dt>
              <dd className="text-sm text-navy whitespace-pre-line">{v}</dd>
            </div>
          ))}
      </dl>
      {children}
    </ModalShell>
  )
}

// ---------------------------------------------------------------- pelanggaran

export function TabPelanggaran({ data, pakaiPoin, opsi, kelola, filter, onFilter, onExport, sibuk, onUbah }) {
  const [detail, setDetail] = useState(null)
  const [riwayat, setRiwayat] = useState(null)
  const [status, setStatus] = useState(null)

  return (
    <div>
      <Saring onExport={onExport} sibuk={sibuk}>
        <Pilih label="Kategori" value={filter.kategori} onChange={(v) => onFilter({ kategori: v })} daftar={opsi.kategori_pelanggaran} />
        <Pilih label="Tingkat pelanggaran" value={filter.tingkat} onChange={(v) => onFilter({ tingkat: v })} daftar={opsi.tingkat_pelanggaran} />
        <Pilih label="Status" value={filter.status} onChange={(v) => onFilter({ status: v })} daftar={opsi.status_pelanggaran} />
        <Cari value={filter.search} onChange={(v) => onFilter({ search: v })} placeholder="Jenis, deskripsi, tindakan…" />
      </Saring>
      {data.length === 0 ? (
        <Kosong>Tidak ada catatan pelanggaran yang cocok dengan filter.</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className={th}>Tanggal</th>
                <th className={th}>Jenis pelanggaran</th>
                <th className={th}>Kategori</th>
                <th className={th}>Tingkat</th>
                {pakaiPoin && <th className={th}>Poin</th>}
                <th className={th}>Tindakan</th>
                <th className={th}>Status</th>
                <th className={th}>Petugas</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} whitespace-nowrap`}>{tgl(p.tanggal)}</td>
                  <td className={td}>
                    <span className="font-semibold">{p.jenis}</span>
                    {p.deskripsi && <span className="block text-xs text-navy/50 line-clamp-2">{p.deskripsi}</span>}
                  </td>
                  <td className={td}>{p.kategori || '-'}</td>
                  <td className={td}>
                    <Badge tone={TONE_TINGKAT_PELANGGARAN[p.tingkat]}>{p.tingkat_label}</Badge>
                  </td>
                  {pakaiPoin && <td className={`${td} tabular-nums`}>{p.poin ?? '-'}</td>}
                  <td className={td}>{p.tindakan || '-'}</td>
                  <td className={td}>
                    <Badge tone={TONE_STATUS_PELANGGARAN[p.status]}>{p.status_label}</Badge>
                  </td>
                  <td className={td}>{p.petugas || '-'}</td>
                  <td className={`${td} whitespace-nowrap space-x-1`}>
                    <Btn kecil onClick={() => setDetail(p)}>
                      Detail
                    </Btn>
                    <Btn kecil onClick={() => setRiwayat(p)}>
                      Riwayat{p.jumlah_tindak_lanjut ? ` (${p.jumlah_tindak_lanjut})` : ''}
                    </Btn>
                    {kelola && (
                      <Btn kecil onClick={() => setStatus(p)}>
                        Status
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detail && (
        <Rincian
          judul={detail.jenis}
          onClose={() => setDetail(null)}
          baris={[
            ['Tanggal', tgl(detail.tanggal)],
            ['Kategori', detail.kategori],
            ['Tingkat', detail.tingkat_label],
            ['Poin', detail.poin],
            ['Deskripsi', detail.deskripsi],
            ['Tindakan', detail.tindakan],
            ['Status', detail.status_label],
            ['Petugas', detail.petugas],
            ['Catatan', detail.catatan],
          ]}
        />
      )}
      {riwayat && <ModalRiwayatPelanggaran p={riwayat} onClose={() => setRiwayat(null)} />}
      {status && (
        <ModalStatusPelanggaran
          p={status}
          onClose={() => setStatus(null)}
          onSaved={() => {
            setStatus(null)
            onUbah('Status pelanggaran diperbarui.')
          }}
        />
      )}
    </div>
  )
}

function ModalRiwayatPelanggaran({ p, onClose }) {
  const [r, setR] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .rpRiwayatPelanggaran(p.id)
      .then(setR)
      .catch((e) => setError(e.message))
  }, [p.id])
  return (
    <ModalShell title={`Riwayat tindakan — ${p.jenis}`} onClose={onClose}>
      <Pesan error={error} />
      {!r && !error && <Kosong>Memuat…</Kosong>}
      {r && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-navy mb-2">Tindak lanjut pembinaan</p>
            {r.tindak_lanjut.length === 0 ? (
              <p className="text-xs text-navy/40">Belum ada tindak lanjut untuk pelanggaran ini.</p>
            ) : (
              <ul className="space-y-2">
                {r.tindak_lanjut.map((t) => (
                  <li key={t.id} className="border border-navy/10 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-navy/50">{tgl(t.tanggal_pembinaan)}</span>
                      <span className="text-sm font-semibold text-navy">{t.jenis_tindakan}</span>
                      <Badge tone={TONE_STATUS_TL[t.status]}>{t.status_label}</Badge>
                    </div>
                    <p className="text-xs text-navy/60">Pembina: {t.pembina}</p>
                    {t.catatan && <p className="text-xs text-navy mt-1">{t.catatan}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-navy mb-2">Perubahan pada catatan pelanggaran (audit)</p>
            <RiwayatList items={r.log} label={LABEL_EVENT} kosong="Belum ada perubahan yang tercatat sejak fitur audit pembinaan aktif." />
          </div>
        </div>
      )}
    </ModalShell>
  )
}

function ModalStatusPelanggaran({ p, onClose, onSaved }) {
  const [status, setStatus] = useState(p.status)
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  async function kirim() {
    setSimpan(true)
    try {
      await api.rpStatusPelanggaran(p.id, { status, alasan })
      onSaved()
    } catch (e) {
      setError(e.message)
      setSimpan(false)
    }
  }
  return (
    <ModalShell
      title={`Ubah status — ${p.jenis}`}
      onClose={onClose}
      lebar="max-w-md"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={simpan || status === p.status} onClick={kirim}>
            {simpan ? 'Menyimpan…' : 'Simpan'}
          </Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="space-y-3">
        <Field label="Status pelanggaran">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
            <option value="aktif">Aktif</option>
            <option value="dalam_pembinaan">Dalam Pembinaan</option>
            <option value="selesai">Selesai</option>
          </select>
        </Field>
        <Field label="Alasan / keterangan (opsional)" hint="Tercatat di audit bersama nama Anda dan waktu perubahan.">
          <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={2} className={input} />
        </Field>
      </div>
    </ModalShell>
  )
}

// ------------------------------------------------------------------- prestasi

export function TabPrestasi({ data, opsi, filter, onFilter, onExport, sibuk }) {
  const [detail, setDetail] = useState(null)
  return (
    <div>
      <Saring onExport={onExport} sibuk={sibuk}>
        <Pilih label="Bidang" value={filter.bidang} onChange={(v) => onFilter({ bidang: v })} daftar={opsi.bidang_prestasi} />
        <Pilih label="Tingkat" value={filter.tingkat} onChange={(v) => onFilter({ tingkat: v })} daftar={opsi.tingkat_prestasi} />
        <Pilih label="Jenis prestasi" value={filter.jenis} onChange={(v) => onFilter({ jenis: v })} daftar={opsi.jenis_prestasi} />
        <Cari value={filter.search} onChange={(v) => onFilter({ search: v })} placeholder="Nama, penyelenggara, peringkat…" />
      </Saring>
      <p className="text-[11px] text-navy/40 mb-2">Hanya prestasi yang sudah terverifikasi yang ditampilkan.</p>
      {data.length === 0 ? (
        <Kosong>Tidak ada prestasi yang cocok dengan filter.</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className={th}>Tanggal</th>
                <th className={th}>Nama prestasi</th>
                <th className={th}>Bidang</th>
                <th className={th}>Tingkat</th>
                <th className={th}>Jenis</th>
                <th className={th}>Penyelenggara</th>
                <th className={th}>Peringkat</th>
                <th className={th}>Bukti</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} whitespace-nowrap`}>{tgl(p.tanggal)}</td>
                  <td className={`${td} font-semibold`}>{p.judul}</td>
                  <td className={td}>{p.bidang || '-'}</td>
                  <td className={td}>{p.tingkat_label}</td>
                  <td className={td}>{p.jenis_label || '-'}</td>
                  <td className={td}>{p.penyelenggara || '-'}</td>
                  <td className={td}>{p.peringkat || '-'}</td>
                  <td className={td}>
                    {p.bukti_url ? (
                      <a href={`${BASE_URL}${p.bukti_url}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-navy-light hover:underline">
                        Lihat bukti ↗
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={td}>
                    <Btn kecil onClick={() => setDetail(p)}>
                      Detail
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detail && (
        <Rincian
          judul={detail.judul}
          onClose={() => setDetail(null)}
          baris={[
            ['Tanggal', tgl(detail.tanggal)],
            ['Bidang', detail.bidang],
            ['Tingkat', detail.tingkat_label],
            ['Jenis prestasi', detail.jenis_label],
            ['Penyelenggara', detail.penyelenggara],
            ['Peringkat', detail.peringkat],
            ['Keterangan', detail.keterangan],
            ['Dicatat oleh', detail.petugas],
          ]}
        >
          {detail.bukti_url && (
            <a href={`${BASE_URL}${detail.bukti_url}`} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm font-semibold text-navy-light hover:underline">
              Lihat bukti / dokumen ↗
            </a>
          )}
        </Rincian>
      )}
    </div>
  )
}

// -------------------------------------------------------------- tindak lanjut

export function TabTindakLanjut({ data, pilihanPelanggaran, opsi, siswaId, kelola, filter, onFilter, onUbah }) {
  const [form, setForm] = useState(null) // {} = baru, objek = ubah
  const [riwayat, setRiwayat] = useState(null)
  const [error, setError] = useState('')

  async function gantiStatus(t, status) {
    try {
      await api.rpSimpanTl(t.id, {
        siswa_id: t.siswa_id, pelanggaran_id: t.pelanggaran_id, tanggal_pembinaan: t.tanggal_pembinaan, jenis_tindakan: t.jenis_tindakan, pembina: t.pembina, catatan: t.catatan,
        rekomendasi: t.rekomendasi, tanggal_tindak_lanjut: t.tanggal_tindak_lanjut, catatan_internal: t.catatan_internal, status,
      })
      onUbah('Status pembinaan diperbarui.')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-end gap-3 flex-wrap mb-3">
        <Pilih label="Status" value={filter.status} onChange={(v) => onFilter({ status: v })} daftar={opsi.status_tindak_lanjut} />
        <Cari value={filter.search} onChange={(v) => onFilter({ search: v })} placeholder="Tindakan, pembina, catatan…" />
        <span className="flex-1" />
        {kelola && (
          <Btn utama onClick={() => setForm({})}>
            + Catat Pembinaan
          </Btn>
        )}
      </div>
      <Pesan error={error} />
      {data.length === 0 ? (
        <Kosong>Belum ada catatan pembinaan yang cocok dengan filter.</Kosong>
      ) : (
        <div className="space-y-3">
          {data.map((t) => (
            <div key={t.id} className="bg-white border border-navy/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-navy/50">{tgl(t.tanggal_pembinaan)}</span>
                <span className="text-sm font-extrabold text-navy">{t.jenis_tindakan}</span>
                <Badge tone={TONE_STATUS_TL[t.status]}>{t.status_label}</Badge>
                {t.terlambat && <Badge tone="merah">Melewati jadwal tindak lanjut</Badge>}
                <span className="flex-1" />
                <Btn kecil onClick={() => setRiwayat(t)}>
                  Riwayat
                </Btn>
                {kelola && (
                  <>
                    <Btn kecil onClick={() => setForm(t)}>
                      Ubah
                    </Btn>
                    <select value={t.status} onChange={(e) => gantiStatus(t, e.target.value)} className="border border-navy/20 rounded-full text-xs font-semibold px-2 py-1 bg-white" aria-label="Ubah status">
                      {opsi.status_tindak_lanjut.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <p className="text-xs text-navy/60 mt-1">
                Pembina: {t.pembina}
                {t.pelanggaran && <> · Terkait pelanggaran “{t.pelanggaran}”</>}
              </p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-navy">
                {t.catatan && (
                  <p>
                    <span className="text-[11px] font-semibold text-navy/50">Catatan: </span>
                    {t.catatan}
                  </p>
                )}
                {t.rekomendasi && (
                  <p>
                    <span className="text-[11px] font-semibold text-navy/50">Rekomendasi: </span>
                    {t.rekomendasi}
                  </p>
                )}
                {t.tanggal_tindak_lanjut && (
                  <p>
                    <span className="text-[11px] font-semibold text-navy/50">Tindak lanjut pada: </span>
                    {tgl(t.tanggal_tindak_lanjut)}
                  </p>
                )}
              </div>
              {t.catatan_internal && (
                <p className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-1.5">
                  <span className="font-bold">Catatan internal:</span> {t.catatan_internal}
                </p>
              )}
              <p className="text-[11px] text-navy/40 mt-1.5">Dicatat oleh {t.dicatat_oleh || '-'}</p>
            </div>
          ))}
        </div>
      )}
      {form && (
        <FormTindakLanjut
          awal={form}
          siswaId={siswaId}
          opsi={opsi}
          pilihanPelanggaran={pilihanPelanggaran}
          onClose={() => setForm(null)}
          onSaved={() => {
            const baru = !form.id
            setForm(null)
            onUbah(baru ? 'Catatan pembinaan disimpan.' : 'Catatan pembinaan diperbarui.')
          }}
        />
      )}
      {riwayat && <ModalRiwayatTl t={riwayat} onClose={() => setRiwayat(null)} />}
    </div>
  )
}

function FormTindakLanjut({ awal, siswaId, opsi, pilihanPelanggaran, onClose, onSaved }) {
  const edit = Boolean(awal.id)
  const hariIni = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({
    pelanggaran_id: awal.pelanggaran_id ?? '', tanggal_pembinaan: awal.tanggal_pembinaan ?? hariIni, jenis_tindakan: awal.jenis_tindakan ?? '', pembina: awal.pembina ?? opsi.izin.nama_pengguna ?? '',
    catatan: awal.catatan ?? '', rekomendasi: awal.rekomendasi ?? '', tanggal_tindak_lanjut: awal.tanggal_tindak_lanjut ?? '', status: awal.status ?? 'direncanakan', catatan_internal: awal.catatan_internal ?? '',
  })
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  async function kirim(e) {
    e.preventDefault()
    setSimpan(true)
    setError('')
    try {
      await api.rpSimpanTl(awal.id, { ...f, siswa_id: siswaId, pelanggaran_id: f.pelanggaran_id || null })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSimpan(false)
    }
  }

  return (
    <ModalShell title={edit ? 'Ubah Catatan Pembinaan' : 'Catat Pembinaan / Tindak Lanjut'} onClose={onClose}>
      <form onSubmit={kirim} className="space-y-3">
        <Pesan error={error} />
        <Field label="Terkait pelanggaran (opsional)" hint="Kosongkan bila ini pembinaan umum, bukan atas pelanggaran tertentu.">
          <select value={f.pelanggaran_id} onChange={(e) => set('pelanggaran_id', e.target.value)} className={input} disabled={edit}>
            <option value="">— Pembinaan umum —</option>
            {pilihanPelanggaran.map((p) => (
              <option key={p.id} value={p.id}>
                {tgl(p.tanggal)} · {p.jenis} ({p.status})
              </option>
            ))}
          </select>
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tanggal pembinaan">
            <input type="date" required max={hariIni} value={f.tanggal_pembinaan} onChange={(e) => set('tanggal_pembinaan', e.target.value)} className={input} />
          </Field>
          <Field label="Jenis tindakan">
            <input required list="jenis-tindakan" value={f.jenis_tindakan} onChange={(e) => set('jenis_tindakan', e.target.value)} className={input} placeholder="mis. Konseling" />
            <datalist id="jenis-tindakan">
              {opsi.jenis_tindakan.map((j) => (
                <option key={j} value={j} />
              ))}
            </datalist>
          </Field>
          <Field label="Pembina">
            <input required value={f.pembina} onChange={(e) => set('pembina', e.target.value)} className={input} />
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => set('status', e.target.value)} className={input}>
              {opsi.status_tindak_lanjut.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Catatan pembinaan">
          <textarea rows={2} value={f.catatan} onChange={(e) => set('catatan', e.target.value)} className={input} />
        </Field>
        <Field label="Rekomendasi">
          <textarea rows={2} value={f.rekomendasi} onChange={(e) => set('rekomendasi', e.target.value)} className={input} />
        </Field>
        <Field label="Tanggal tindak lanjut">
          <input type="date" min={f.tanggal_pembinaan} value={f.tanggal_tindak_lanjut} onChange={(e) => set('tanggal_tindak_lanjut', e.target.value)} className={input} />
        </Field>
        <Field label="Catatan internal" hint="Hanya terlihat oleh petugas pembinaan. Tidak muncul untuk wali kelas/kepala sekolah dan tidak ikut laporan.">
          <textarea rows={2} value={f.catatan_internal} onChange={(e) => set('catatan_internal', e.target.value)} className={input} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama type="submit" disabled={simpan}>
            {simpan ? 'Menyimpan…' : 'Simpan'}
          </Btn>
        </div>
      </form>
    </ModalShell>
  )
}

function ModalRiwayatTl({ t, onClose }) {
  const [r, setR] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .rpRiwayatTl(t.id)
      .then(setR)
      .catch((e) => setError(e.message))
  }, [t.id])
  return (
    <ModalShell title={`Riwayat pembinaan — ${t.jenis_tindakan}`} onClose={onClose} lebar="max-w-xl">
      <Pesan error={error} />
      {!r && !error && <Kosong>Memuat…</Kosong>}
      {r && <RiwayatList items={r} label={LABEL_EVENT} />}
    </ModalShell>
  )
}
