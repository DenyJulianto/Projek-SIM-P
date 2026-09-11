import { useState } from 'react'
import { api } from '../lib/api'

export default function CompleteNameForm({ user, onDone }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await api.updateMe({ name, email: user.email })
      onDone(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Lengkapi Profil</h1>
      <p className="text-navy/50 text-sm mt-1 mb-6">
        Satu langkah lagi — masukkan nama lengkap Anda untuk mulai menggunakan SIM Pendidikan.
      </p>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg text-sm text-center py-2 px-3 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Lengkap..............."
          className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
        />

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide px-10 py-2.5 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? 'MENYIMPAN...' : 'LANJUTKAN'}
          </button>
        </div>
      </form>
    </>
  )
}
