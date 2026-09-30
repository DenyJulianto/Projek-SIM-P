import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

/**
 * Mode edit landing page. Komponen landing (Header, Hero, About, dst.)
 * dirender apa adanya; kalau dibungkus provider ini, bagian yang bisa
 * diubah berubah jadi isian langsung di tempat (WYSIWYG) — dipakai di
 * menu "Edit Landing Page" Admin Sekolah.
 */
const LandingEditContext = createContext(null)

export function LandingEditProvider({ draft, onChange, children }) {
  return <LandingEditContext.Provider value={{ draft, onChange }}>{children}</LandingEditContext.Provider>
}

/** null di landing publik; { draft, onChange } saat di editor. */
export function useLandingEdit() {
  return useContext(LandingEditContext)
}

const EDIT_OUTLINE =
  'rounded-md outline-2 outline-dashed outline-gold/60 outline-offset-2 hover:outline-gold focus:outline-gold focus:bg-white/10'

/**
 * Teks yang bisa diedit. Di landing publik cukup menampilkan `value`;
 * di editor berubah jadi input/textarea yang mewarisi font & warna
 * sekelilingnya sehingga tampilannya tetap sama dengan aslinya.
 */
export function EditableText({ field, value, placeholder = '', multiline = false, className = '' }) {
  const edit = useLandingEdit()
  const ref = useRef(null)
  const current = edit ? (edit.draft[field] ?? '') : value

  useLayoutEffect(() => {
    if (edit && multiline && ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [edit, multiline, current])

  if (!edit) return <>{value}</>

  const shared = {
    ref,
    value: current,
    placeholder,
    onChange: (e) => edit.onChange(field, e.target.value),
    className: `bg-transparent text-inherit placeholder:text-current placeholder:opacity-40 ${EDIT_OUTLINE} ${className}`,
    style: { font: 'inherit', letterSpacing: 'inherit' },
  }

  if (multiline) {
    return <textarea {...shared} rows={1} className={`${shared.className} block w-full resize-none overflow-hidden`} />
  }

  return (
    <input
      {...shared}
      type="text"
      size={Math.max(String(current).length, placeholder.length, 4)}
      className={`${shared.className} max-w-full`}
    />
  )
}

/**
 * Gambar yang bisa diganti. Di editor muncul tombol "Ganti Gambar"
 * (upload file) dan "Hapus" di atas gambarnya.
 */
export function EditableImage({ field, className = '', children, compact = false }) {
  const edit = useLandingEdit()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (!edit) return children

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await api.uploadGambarLanding(file)
      edit.onChange(field, res.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`relative group ${className}`}>
      {children}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-2 bg-navy/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-[inherit] ${
          uploading ? 'sm:opacity-100' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`bg-white text-navy font-semibold rounded-full shadow ${
            compact ? 'text-[10px] px-2 py-1' : 'text-xs px-4 py-2'
          } disabled:opacity-60`}
        >
          {uploading ? 'Mengunggah...' : compact ? 'Ganti' : 'Ganti Gambar'}
        </button>
        {!compact && edit.draft[field] && (
          <button
            type="button"
            onClick={() => edit.onChange(field, '')}
            className="bg-white/90 text-red-600 text-xs font-semibold px-4 py-2 rounded-full shadow"
          >
            Hapus
          </button>
        )}
      </div>
      {error && (
        <p className="absolute left-2 right-2 bottom-2 text-[11px] text-white bg-red-600/90 rounded px-2 py-1">
          {error}
        </p>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
