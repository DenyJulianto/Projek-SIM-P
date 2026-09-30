const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

let scriptPromise = null

function loadScript() {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat reCAPTCHA'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Ambil token reCAPTCHA v3 untuk sebuah aksi (mis. "register"). Balik
 * `null` kalau site key belum dikonfigurasi — backend juga melewati
 * verifikasi captcha dalam kondisi ini, jadi form tetap bisa dipakai saat
 * dev/test tanpa akun Google reCAPTCHA.
 */
export async function getRecaptchaToken(action) {
  if (!SITE_KEY) return null

  await loadScript()

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(SITE_KEY, { action })
        .then(resolve)
        .catch(() => reject(new Error('Verifikasi keamanan gagal. Silakan coba lagi.')))
    })
  })
}

export const isRecaptchaEnabled = Boolean(SITE_KEY)
