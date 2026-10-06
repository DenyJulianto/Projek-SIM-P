import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '../lib/api'

/**
 * Alur aktivasi 2FA: pindai QR di aplikasi authenticator, masukkan kode,
 * lalu simpan kode pemulihan. `onSelesai` dipanggil setelah pengguna
 * menyatakan sudah menyimpan kode pemulihan.
 */
export default function Setup2FA({ onSelesai, onBatal }) {
  const [setup, setSetup] = useState(null)
  const [qr, setQr] = useState('')
  const [kode, setKode] = useState('')
  const [pemulihan, setPemulihan] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dimulai = useRef(false)

  useEffect(() => {
    if (dimulai.current) return
    dimulai.current = true
    api
      .setupTwoFactor()
      .then((res) => {
        setSetup(res)
        return QRCode.toDataURL(res.otpauth_url, { margin: 1, width: 200 })
      })
      .then(setQr)
      .catch((err) => setError(err.message))
  }, [])

  async function konfirmasi(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.confirmTwoFactor(kode.replace(/\s/g, ''))
      setPemulihan(res.recovery_codes)
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setBusy(false)
    }
  }

  function unduhKode() {
    const blob = new Blob([`Kode pemulihan 2FA SIM Pendidikan\n\n${pemulihan.join('\n')}\n`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kode-pemulihan-2fa.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (pemulihan) {
    return (
      <div>
        <h2 className="text-lg font-extrabold text-navy mb-1">2FA Aktif — Simpan Kode Pemulihan</h2>
        <p className="text-sm text-navy/60 mb-4">
          Jika ponsel Anda hilang, masuk memakai salah satu kode ini (masing-masing hanya bisa dipakai sekali). Simpan di
          tempat aman — kode ini tidak akan ditampilkan lagi.
        </p>
        <div className="grid grid-cols-2 gap-2 bg-navy/5 rounded-xl p-4 font-mono text-sm text-navy mb-4">
          {pemulihan.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={unduhKode} className="border border-navy/20 text-navy text-sm font-semibold px-4 py-2 rounded-full hover:bg-navy/5">
            Unduh (.txt)
          </button>
          <button onClick={onSelesai} className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full">
            Saya sudah menyimpannya
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold text-navy mb-1">Aktifkan Verifikasi Dua Langkah</h2>
      <ol className="text-sm text-navy/60 mb-4 list-decimal list-inside space-y-1">
        <li>Pasang aplikasi authenticator (Google Authenticator, Microsoft Authenticator, dll).</li>
        <li>Pindai kode QR di bawah, atau masukkan kunci secara manual.</li>
        <li>Masukkan kode 6 digit yang muncul di aplikasi.</li>
      </ol>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}

      {!setup && !error && <p className="text-sm text-navy/40">Menyiapkan…</p>}
      {setup && (
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-5">
          {qr ? <img src={qr} alt="Kode QR 2FA" className="h-[180px] w-[180px] rounded-xl border border-navy/10" /> : <div className="h-[180px] w-[180px]" />}
          <div className="text-sm text-navy/70">
            <p className="text-xs font-semibold text-navy/50 mb-1">Kunci manual</p>
            <p className="font-mono text-navy bg-navy/5 rounded-lg px-3 py-2 break-all">{setup.manual_entry_key}</p>
          </div>
        </div>
      )}

      <form onSubmit={konfirmasi} className="flex flex-wrap gap-3">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          placeholder="Kode 6 digit"
          className="flex-1 min-w-[140px] border border-navy/15 rounded-full px-4 py-2.5 text-sm tracking-widest"
        />
        <button
          type="submit"
          disabled={busy || !setup || kode.replace(/\s/g, '').length < 6}
          className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
        >
          {busy ? 'Memeriksa…' : 'Aktifkan'}
        </button>
        {onBatal && (
          <button type="button" onClick={onBatal} className="text-sm text-navy/50 hover:text-navy px-2">
            Batal
          </button>
        )}
      </form>
    </div>
  )
}
