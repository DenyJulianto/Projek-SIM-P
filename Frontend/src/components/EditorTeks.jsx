import { useEffect, useRef, useState } from 'react'
import { adalahHtml, htmlAman, teksPolos } from '../lib/perangkatAjar'

// Gaya isi teks berformat (daftar, tabel) — dipakai editor dan tampilan baca.
export const KONTEN_HTML =
  '[&_p]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_li]:my-0.5 ' +
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top ' +
  '[&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left'

const TOMBOL = [
  { perintah: 'bold', label: 'B', judul: 'Tebal (Ctrl+B)', kelas: 'font-bold' },
  { perintah: 'italic', label: 'I', judul: 'Miring (Ctrl+I)', kelas: 'italic font-serif' },
  { perintah: 'underline', label: 'U', judul: 'Garis bawah (Ctrl+U)', kelas: 'underline' },
  { pemisah: true },
  { perintah: 'insertOrderedList', label: '1.', judul: 'Daftar bernomor', kelas: 'font-semibold' },
  { perintah: 'insertUnorderedList', label: '•', judul: 'Daftar berpoin', kelas: 'text-lg leading-none' },
  { pemisah: true },
  { aksi: 'tabel', label: '▦ Tabel', judul: 'Sisipkan tabel 3 kolom' },
  { aksi: 'baris', label: '+ Baris', judul: 'Tambah baris di tabel (letakkan kursor di dalam tabel)' },
]

// Editor teks sederhana berbasis contentEditable. Nilai berupa HTML yang
// sudah dibersihkan (hanya tag format dasar).
export default function EditorTeks({ value, onChange, placeholder, tinggi = 'min-h-[96px]', wajib, galat }) {
  const ref = useRef(null)
  const [kosong, setKosong] = useState(!teksPolos(value))
  const [fokus, setFokus] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || document.activeElement === el) return
    const bersih = htmlAman(value || '')
    if (el.innerHTML !== bersih) el.innerHTML = bersih
    setKosong(!teksPolos(bersih) && !el.querySelector('table'))
  }, [value])

  function kirim() {
    const el = ref.current
    const ada = teksPolos(el.innerHTML) || el.querySelector('table')
    setKosong(!ada)
    // Selalu kirim HTML (teks tanpa tag dibungkus <p>) supaya tidak tertukar
    // dengan teks biasa dari data lama yang perlu di-escape.
    const html = el.innerHTML
    onChange(ada ? (adalahHtml(html) ? html : `<p>${html}</p>`) : '')
  }

  function jalankan(b) {
    ref.current.focus()
    if (b.perintah) {
      document.execCommand(b.perintah)
    } else if (b.aksi === 'tabel') {
      const sel = '<td><br></td>'.repeat(3)
      document.execCommand('insertHTML', false, `<table><tbody><tr>${sel}</tr><tr>${sel}</tr></tbody></table><p><br></p>`)
    } else if (b.aksi === 'baris') {
      const node = window.getSelection()?.anchorNode
      const tr = (node?.nodeType === 1 ? node : node?.parentElement)?.closest('tr')
      if (!tr || !ref.current.contains(tr)) return
      const baru = tr.cloneNode(true)
      baru.querySelectorAll('td,th').forEach((td) => (td.innerHTML = '<br>'))
      tr.after(baru)
    }
    kirim()
  }

  function tempel(e) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const teks = e.clipboardData.getData('text/plain')
    document.execCommand('insertHTML', false, html ? htmlAman(html) : htmlAman(teks))
    kirim()
  }

  return (
    <div
      className={`rounded-xl border bg-white transition-colors ${
        galat ? 'border-red-300' : fokus ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 px-1.5 py-1 bg-slate-50 rounded-t-xl">
        {TOMBOL.map((b, i) =>
          b.pemisah ? (
            <span key={i} className="mx-1 h-4 w-px bg-slate-300" />
          ) : (
            <button
              key={i}
              type="button"
              title={b.judul}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => jalankan(b)}
              className={`min-w-7 h-7 px-1.5 rounded-md text-xs text-slate-700 hover:bg-white hover:shadow-sm ${b.kelas || ''}`}
            >
              {b.label}
            </button>
          )
        )}
      </div>
      <div className="relative">
        {kosong && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2.5 text-sm text-slate-400">{placeholder}</p>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-required={wajib || undefined}
          onInput={kirim}
          onPaste={tempel}
          onFocus={() => setFokus(true)}
          onBlur={() => {
            setFokus(false)
            kirim()
          }}
          className={`${tinggi} px-3 py-2.5 text-sm text-slate-800 leading-relaxed outline-none ${KONTEN_HTML}`}
        />
      </div>
    </div>
  )
}
