import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

/**
 * Mode ujian aman untuk kuis siswa:
 * - halaman kuis dibuka layar penuh dan menutupi dashboard;
 * - selama siswa tetap di halaman kuis, tidak ada bunyi;
 * - bila siswa keluar layar penuh, pindah tab, atau pindah jendela, alarm
 *   berbunyi terus sampai siswa kembali ke halaman kuis (layar penuh),
 *   status menjadi "Bermasalah", dan pelanggaran dicatat ke server
 *   (terlihat oleh guru).
 *
 * - siswa dicegah meninggalkan halaman: tombol Back/Forward browser
 *   dikunci, pintasan keyboard (muat ulang, tutup/buka tab, pindah tab,
 *   devtools) dinonaktifkan, dan di Chrome/Edge tombol sistem seperti
 *   Alt+Tab, tombol Windows, dan Esc ikut ditangkap (Keyboard Lock API).
 *
 * Browser tidak mengizinkan halaman mengunci siswa sepenuhnya (mis.
 * Ctrl+Alt+Del, tombol Home di HP, atau browser tanpa Keyboard Lock), jadi
 * sisanya dideteksi, dibunyikan alarm, dan ditandai. Alarm tetap terdengar
 * dari tab di latar belakang karena AudioContext sudah diaktifkan saat siswa
 * klik "Kerjakan Ujian".
 */

let audioCtx = null
let alarm = null

/**
 * Panggil langsung di dalam handler klik "Mulai" (sebelum await apa pun):
 * layar penuh dan audio hanya boleh diaktifkan dari aksi pengguna.
 */
export function siapkanModeUjian() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) {
      audioCtx = audioCtx || new Ctx()
      audioCtx.resume?.()
    }
  } catch {
    audioCtx = null
  }
  masukLayarPenuh()
}

function masukLayarPenuh() {
  const el = document.documentElement
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen({ navigationUI: 'hide' })
      .then(kunciKeyboard)
      .catch(() => {})
  } else if (document.fullscreenElement) {
    kunciKeyboard()
  }
}

/**
 * Keyboard Lock API (Chrome/Edge, hanya berlaku saat layar penuh): tombol
 * sistem seperti Alt+Tab, tombol Windows, dan Esc dikirim ke halaman ujian
 * alih-alih ke sistem/browser. Keluar layar penuh harus dengan menahan Esc.
 */
function kunciKeyboard() {
  navigator.keyboard?.lock?.().catch(() => {})
}

export function keluarLayarPenuh() {
  navigator.keyboard?.unlock?.()
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  }
}

/**
 * Pintasan keyboard yang dipakai untuk meninggalkan / memuat ulang halaman,
 * berpindah tab, atau membuka devtools. Mengetik jawaban tetap normal.
 */
function pintasanTerlarang(e) {
  const k = e.key?.toLowerCase() ?? ''
  const mod = e.ctrlKey || e.metaKey
  if (['f5', 'f11', 'f12', 'escape', 'meta', 'os', 'browserback', 'browserforward', 'browserrefresh'].includes(k)) return true
  if (e.altKey && ['arrowleft', 'arrowright', 'tab', 'home', 'f4'].includes(k)) return true
  if (mod && ['r', 'w', 't', 'n', 'l', 'p', 's', 'u', 'o', 'h', 'j', 'tab', 'pageup', 'pagedown', 'f4'].includes(k)) return true
  if (mod && e.shiftKey && ['i', 'j', 'c', 'n', 't', 'tab'].includes(k)) return true
  return false
}

// Pola lonceng lembut: arpeggio E5-G5-B5-E6 lalu jeda, diulang terus.
const NADA_LONCENG = [
  [0, 659.25],
  [0.22, 783.99],
  [0.44, 987.77],
  [0.66, 1318.51],
]
const PANJANG_POLA_DETIK = 2.6
let bufferLonceng = null

/**
 * Render satu siklus pola lonceng ke AudioBuffer. Tiap nada = nada dasar
 * + overtone lonceng (2x & 2.76x) dengan peluruhan eksponensial pelan.
 */
function buatBufferLonceng(ctx) {
  const rate = ctx.sampleRate
  const panjang = Math.floor(rate * PANJANG_POLA_DETIK)
  const buffer = ctx.createBuffer(1, panjang, rate)
  const data = buffer.getChannelData(0)
  for (const [mulai, f] of NADA_LONCENG) {
    const awal = Math.floor(mulai * rate)
    for (let i = awal; i < panjang; i++) {
      const t = (i - awal) / rate
      const serang = Math.min(1, t / 0.006)
      const luruh = Math.exp(-t / 0.55)
      const w = 2 * Math.PI * f * t
      data[i] +=
        serang * luruh * (Math.sin(w) + 0.35 * Math.sin(2 * w) * Math.exp(-t / 0.25) + 0.15 * Math.sin(2.76 * w) * Math.exp(-t / 0.15))
    }
  }
  let puncak = 0
  for (let i = 0; i < panjang; i++) puncak = Math.max(puncak, Math.abs(data[i]))
  // Sambungan ujung pola dibuat senyap supaya pengulangan tidak berbunyi "klik".
  for (let i = 0; i < panjang; i++) {
    const ekor = Math.min(1, (panjang - i) / (rate * 0.05))
    data[i] = (data[i] / puncak) * 0.5 * ekor
  }
  return buffer
}

/**
 * Alarm lonceng yang berulang tanpa timer JavaScript (AudioBuffer loop),
 * sehingga iramanya tetap rapi walau tab kuis di latar belakang.
 */
function mulaiAlarm() {
  if (alarm || !audioCtx) return
  audioCtx.resume?.()
  bufferLonceng = bufferLonceng || buatBufferLonceng(audioCtx)
  const t = audioCtx.currentTime
  const sumber = audioCtx.createBufferSource()
  const gain = audioCtx.createGain()
  sumber.buffer = bufferLonceng
  sumber.loop = true
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.9, t + 0.15)
  sumber.connect(gain).connect(audioCtx.destination)
  sumber.start(t)
  alarm = { sumber, gain }
}

function hentikanAlarm() {
  if (!alarm) return
  const { sumber, gain } = alarm
  alarm = null
  try {
    const t = audioCtx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    sumber.stop(t + 0.4)
  } catch {
    // node sudah berhenti
  }
}

const LABEL_JENIS = {
  keluar_layar_penuh: 'keluar dari layar penuh',
  pindah_tab: 'pindah tab',
  pindah_jendela: 'pindah ke jendela/aplikasi lain',
  keluar_halaman: 'mencoba meninggalkan halaman ujian',
}

// Penanda entri riwayat browser milik halaman ujian (lihat penguncian tombol Back).
const KUNCI_RIWAYAT = 'simUjianKunci'

export default function ModeUjianAman({ ujianId, awalPelanggaran = 0, judul, subjudul, children, onSelesai, busy }) {
  const [pelanggaran, setPelanggaran] = useState(awalPelanggaran)
  const [terakhir, setTerakhir] = useState(null)
  const [layarPenuh, setLayarPenuh] = useState(!!document.fullscreenElement)
  const [alarmNyala, setAlarmNyala] = useState(false)
  const [konfirmasiSelesai, setKonfirmasiSelesai] = useState(false)
  const [peringatan, setPeringatan] = useState('')
  const peringatanTimerRef = useRef(null)
  const selesaiRef = useRef(false)
  const siapRef = useRef(false)
  const terakhirLaporRef = useRef(0)
  const terpasangRef = useRef(false)
  const didukung = !!document.documentElement.requestFullscreen
  const aman = pelanggaran === 0

  const catat = useCallback(
    (jenis) => {
      if (selesaiRef.current || !siapRef.current) return
      const now = Date.now()
      // Satu kali keluar bisa memicu beberapa event sekaligus (blur + tab
      // tersembunyi + keluar layar penuh); hitung sebagai satu pelanggaran.
      if (now - terakhirLaporRef.current < 1500) return
      terakhirLaporRef.current = now
      setPelanggaran((n) => n + 1)
      setTerakhir({ jenis, waktu: new Date() })
      api.laporPelanggaranUjian(ujianId, jenis).catch(() => {})
    },
    [ujianId]
  )

  const beriPeringatan = useCallback((teks) => {
    setPeringatan(teks)
    clearTimeout(peringatanTimerRef.current)
    peringatanTimerRef.current = setTimeout(() => setPeringatan(''), 3500)
  }, [])

  useEffect(() => {
    // Beri jeda singkat sebelum mulai memantau, supaya transisi masuk
    // layar penuh tidak dihitung sebagai pelanggaran.
    const t = setTimeout(() => {
      siapRef.current = true
    }, 1500)

    const keluar = (jenis) => {
      if (selesaiRef.current || !siapRef.current) return
      mulaiAlarm()
      setAlarmNyala(true)
      catat(jenis)
    }
    // Alarm berhenti hanya bila siswa benar-benar kembali: tab terlihat,
    // jendela fokus, dan (bila didukung) layar penuh lagi.
    const cekKembali = () => {
      const penuh = !!document.fullscreenElement || !didukung
      if (document.visibilityState === 'visible' && document.hasFocus() && penuh) {
        hentikanAlarm()
        setAlarmNyala(false)
      }
    }

    const onFullscreen = () => {
      const penuh = !!document.fullscreenElement
      setLayarPenuh(penuh)
      if (penuh) cekKembali()
      else keluar('keluar_layar_penuh')
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') keluar('pindah_tab')
      else cekKembali()
    }
    const onBlur = () => keluar('pindah_jendela')
    const onFocus = () => cekKembali()
    const cegah = (e) => e.preventDefault()
    const onBeforeUnload = (e) => {
      if (selesaiRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    // Pintasan untuk muat ulang, tutup/pindah tab, Back, devtools: diblokir.
    const onKeyDown = (e) => {
      if (selesaiRef.current || !pintasanTerlarang(e)) return
      e.preventDefault()
      e.stopPropagation()
      beriPeringatan('Pintasan keyboard ini dinonaktifkan selama ujian berlangsung.')
    }
    // Tombol Back/Forward browser (termasuk gestur geser): kembalikan ke
    // halaman ujian dan catat sebagai upaya meninggalkan ujian.
    const onPopState = () => {
      if (selesaiRef.current) return
      window.history.pushState({ ...window.history.state, [KUNCI_RIWAYAT]: true }, '', window.location.href)
      beriPeringatan('Halaman ujian tidak bisa ditinggalkan sebelum ujian diselesaikan.')
      catat('keluar_halaman')
    }

    document.addEventListener('fullscreenchange', onFullscreen)
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('popstate', onPopState)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('contextmenu', cegah)
    document.addEventListener('copy', cegah)
    document.addEventListener('cut', cegah)
    document.addEventListener('paste', cegah)

    return () => {
      clearTimeout(t)
      document.removeEventListener('fullscreenchange', onFullscreen)
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('contextmenu', cegah)
      document.removeEventListener('copy', cegah)
      document.removeEventListener('cut', cegah)
      document.removeEventListener('paste', cegah)
    }
  }, [catat, didukung, beriPeringatan])

  // Keluar layar penuh hanya saat halaman kuis benar-benar ditutup. Efek di
  // atas bisa dibongkar-pasang ulang (mis. StrictMode) tanpa kuis ditutup,
  // jadi cek ulang setelah satu tick apakah komponen memang sudah hilang.
  useEffect(() => {
    terpasangRef.current = true
    // Entri riwayat tambahan dengan URL yang sama: tombol Back hanya
    // "memakan" entri ini (lalu dipasang lagi) dan siswa tetap di ujian.
    if (!window.history.state?.[KUNCI_RIWAYAT]) {
      window.history.pushState({ ...window.history.state, [KUNCI_RIWAYAT]: true }, '', window.location.href)
    }
    return () => {
      terpasangRef.current = false
      setTimeout(() => {
        if (!terpasangRef.current) {
          hentikanAlarm()
          keluarLayarPenuh()
          clearTimeout(peringatanTimerRef.current)
          // Buang entri penguncian supaya Back setelah ujian berperilaku normal.
          if (window.history.state?.[KUNCI_RIWAYAT]) window.history.back()
        }
      }, 0)
    }
  }, [])

  async function selesaikan() {
    selesaiRef.current = true
    hentikanAlarm()
    const ok = await onSelesai()
    if (ok === false) {
      selesaiRef.current = false
      return
    }
    setKonfirmasiSelesai(false)
  }

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto bg-slate-50 select-none">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-navy/10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {subjudul && <p className="text-xs text-navy/50">{subjudul}</p>}
            <p className="font-extrabold text-navy truncate">{judul}</p>
          </div>
          {aman ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-3 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
              </span>
              Mode ujian aman
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-bold text-red-700 bg-red-100 rounded-full px-3 py-1.5">
              {alarmNyala ? '🔊 Alarm berbunyi' : '⚠ Bermasalah'} · keluar {pelanggaran}×
            </span>
          )}
        </div>
        {!aman && (
          <div className="bg-red-600 text-white text-xs">
            <div className="mx-auto max-w-3xl px-4 py-2">
              Terdeteksi keluar dari halaman ujian
              {terakhir ? ` (${LABEL_JENIS[terakhir.jenis]}, ${terakhir.waktu.toLocaleTimeString('id-ID')})` : ''}. Kejadian
              ini sudah dicatat dan dilaporkan ke guru. Alarm akan berbunyi setiap kali Anda keluar dari halaman ujian.
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {children}

        <button
          onClick={() => setKonfirmasiSelesai(true)}
          disabled={busy}
          className="mt-5 w-full sm:w-auto text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-6 py-3 transition-colors disabled:opacity-50"
        >
          Selesaikan Ujian
        </button>
      </div>

      {didukung && !layarPenuh && !konfirmasiSelesai && (
        <div className="fixed inset-0 z-20 bg-navy/90 flex items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <p className="text-white text-lg font-extrabold mb-2">Halaman ujian harus layar penuh</p>
            <p className="text-white/70 text-sm mb-5">
              Kembali ke layar penuh untuk melanjutkan mengerjakan kuis dan mematikan alarm.
              {!aman && ' Keluarnya Anda dari halaman ini sudah tercatat.'}
            </p>
            <button
              onClick={masukLayarPenuh}
              className="bg-white text-navy font-bold text-sm rounded-full px-6 py-3 hover:bg-emerald-50"
            >
              Kembali ke Layar Penuh
            </button>
          </div>
        </div>
      )}

      {peringatan && (
        <div
          role="alert"
          className="fixed left-1/2 bottom-6 z-40 -translate-x-1/2 max-w-[calc(100%-2rem)] bg-navy text-white text-sm font-semibold rounded-full px-5 py-3 shadow-lg"
        >
          {peringatan}
        </div>
      )}

      {konfirmasiSelesai && (
        <div className="fixed inset-0 z-30 bg-navy/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <p className="font-extrabold text-navy mb-1">Selesaikan ujian sekarang?</p>
            <p className="text-sm text-navy/60 mb-5">Jawaban tidak bisa diubah lagi setelah ini.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setKonfirmasiSelesai(false)}
                disabled={busy}
                className="text-sm font-semibold text-navy/70 rounded-full px-5 py-2.5 hover:bg-navy/5"
              >
                Batal
              </button>
              <button
                onClick={selesaikan}
                disabled={busy}
                className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
              >
                {busy ? 'Menyimpan...' : 'Ya, Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
