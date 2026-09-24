import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ModalShell } from './GreenModal'

function formatRupiah(value) {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

export default function QrisModal({ tagihan, onClose }) {
  const [qris, setQris] = useState(null)
  const [image, setImage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getQrisTagihan(tagihan.id)
      .then((data) => {
        setQris(data)
        return QRCode.toDataURL(data.payload, { width: 320, margin: 1 })
      })
      .then((url) => url && setImage(url))
      .catch((err) => setError(err.message))
  }, [tagihan.id])

  function download() {
    const a = document.createElement('a')
    a.href = image
    a.download = `qris-${tagihan.id}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <ModalShell
      title="QRIS Pembayaran"
      subtitle={`${tagihan.siswa?.nama || ''} — ${tagihan.judul}`}
      onClose={onClose}
      dismissOnBackdrop
    >
      {error && <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm px-3 py-2">{error}</p>}

      {!error && !image && <p className="text-sm text-navy/40 text-center py-10">Membuat QRIS...</p>}

      {image && qris && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 text-center">
          <img src={image} alt="QRIS" className="mx-auto rounded-lg" />
          <p className="text-xl font-extrabold text-navy mt-3">{formatRupiah(qris.jumlah)}</p>
          {qris.merchant_nama && (
            <p className="text-xs text-navy/50 mt-1">
              {qris.merchant_nama}
              {qris.merchant_kota ? ` — ${qris.merchant_kota}` : ''}
            </p>
          )}
          <p className="text-[11px] text-navy/40 mt-3">
            Pindai dengan aplikasi mobile banking/e-wallet apa pun yang mendukung QRIS. Setelah dana masuk, cocokkan mutasinya
            lewat menu Rekonsiliasi.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-5">
        {image && (
          <button
            type="button"
            onClick={download}
            className="border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
          >
            Unduh QR
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="bg-navy hover:bg-navy/90 text-white text-sm font-bold px-7 py-2.5 rounded-full shadow-md transition-colors"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  )
}
