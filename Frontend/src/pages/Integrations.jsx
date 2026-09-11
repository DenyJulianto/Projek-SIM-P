import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_STYLE = {
  terkonfigurasi: 'bg-emerald-100 text-emerald-700',
  'belum-lengkap': 'bg-amber-100 text-amber-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}

const STATUS_LABEL = {
  terkonfigurasi: 'Terkonfigurasi',
  'belum-lengkap': 'Belum Lengkap',
  nonaktif: 'Nonaktif',
}

export default function Integrations({ onBack }) {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api
      .listIntegrations()
      .then(setIntegrations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function updateLocal(key, patch) {
    setIntegrations((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <PlugIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Integrasi</h1>
            <p className="text-sm text-navy/50">Hubungkan sistem ini dengan layanan eksternal.</p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              onSaved={(updated) => updateLocal(integration.key, updated)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function IntegrationCard({ integration, onSaved }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => buildForm(integration))
  const [enabled, setEnabled] = useState(integration.enabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await api.updateIntegration(integration.key, { config: form, enabled })
      onSaved(updated)
      setForm(buildForm(updated))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTestEmail() {
    setTesting(true)
    setTestResult('')
    try {
      await api.testEmailIntegration(testTo)
      setTestResult('Email uji berhasil dikirim.')
    } catch (err) {
      setTestResult(err.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-navy/5 flex items-center justify-center shrink-0">
            <PlugIcon className="h-5 w-5 text-navy/50" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">{integration.name}</p>
            <p className="text-xs text-navy/50 truncate">{integration.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[integration.status]}`}
          >
            {STATUS_LABEL[integration.status]}
          </span>
          <ChevronIcon className={`h-4 w-4 text-navy/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <form onSubmit={handleSave} className="border-t border-navy/10 p-5 space-y-4">
          <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-navy-light"
            />
            Aktifkan integrasi ini
          </label>

          <FieldsFor integration={integration} form={form} update={update} />

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>

          {integration.key === 'smtp_email' && (
            <div className="border-t border-navy/10 pt-4">
              <p className="text-xs font-semibold text-navy/70 mb-2">Kirim Email Uji Coba</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="alamat@email.com"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testing || !testTo}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 hover:bg-navy hover:text-white transition-colors disabled:opacity-40"
                >
                  {testing ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
              {testResult && <p className="text-xs text-navy/60 mt-2">{testResult}</p>}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

function FieldsFor({ integration, form, update }) {
  if (integration.key === 'smtp_email') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Host SMTP">
          <input type="text" value={form.host || ''} onChange={(e) => update('host', e.target.value)} className="input" placeholder="smtp.gmail.com" />
        </Field>
        <Field label="Port">
          <input type="text" value={form.port || ''} onChange={(e) => update('port', e.target.value)} className="input" placeholder="587" />
        </Field>
        <Field label="Username">
          <input type="text" value={form.username || ''} onChange={(e) => update('username', e.target.value)} className="input" />
        </Field>
        <Field label={integration.password_is_set ? 'Password (sudah diatur, isi untuk ganti)' : 'Password'}>
          <input type="password" value={form.password || ''} onChange={(e) => update('password', e.target.value)} className="input" placeholder={integration.password_is_set ? '••••••••' : ''} />
        </Field>
        <Field label="Enkripsi">
          <select value={form.encryption || 'tls'} onChange={(e) => update('encryption', e.target.value)} className="input">
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
          </select>
        </Field>
        <Field label="Nama Pengirim">
          <input type="text" value={form.from_name || ''} onChange={(e) => update('from_name', e.target.value)} className="input" />
        </Field>
        <Field label="Alamat Email Pengirim">
          <input type="email" value={form.from_address || ''} onChange={(e) => update('from_address', e.target.value)} className="input" />
        </Field>
      </div>
    )
  }

  if (integration.key === 'whatsapp_notifikasi') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Penyedia">
          <input type="text" value={form.provider || ''} onChange={(e) => update('provider', e.target.value)} className="input" placeholder="mis. Fonnte, Twilio" />
        </Field>
        <Field label="Nomor Pengirim">
          <input type="text" value={form.sender_number || ''} onChange={(e) => update('sender_number', e.target.value)} className="input" placeholder="628xxxxxxxxxx" />
        </Field>
        <Field label={integration.api_key_is_set ? 'API Key (sudah diatur, isi untuk ganti)' : 'API Key'}>
          <input type="password" value={form.api_key || ''} onChange={(e) => update('api_key', e.target.value)} className="input" placeholder={integration.api_key_is_set ? '••••••••' : ''} />
        </Field>
      </div>
    )
  }

  if (integration.key === 'payment_gateway') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Penyedia">
          <input type="text" value={form.provider || ''} onChange={(e) => update('provider', e.target.value)} className="input" placeholder="mis. Midtrans, Xendit" />
        </Field>
        <Field label="Merchant ID">
          <input type="text" value={form.merchant_id || ''} onChange={(e) => update('merchant_id', e.target.value)} className="input" />
        </Field>
        <Field label={integration.api_key_is_set ? 'API Key (sudah diatur, isi untuk ganti)' : 'API Key'}>
          <input type="password" value={form.api_key || ''} onChange={(e) => update('api_key', e.target.value)} className="input" placeholder={integration.api_key_is_set ? '••••••••' : ''} />
        </Field>
        <Field label="Mode Produksi">
          <select value={form.is_production ? '1' : '0'} onChange={(e) => update('is_production', e.target.value === '1')} className="input">
            <option value="0">Sandbox / Uji Coba</option>
            <option value="1">Produksi</option>
          </select>
        </Field>
      </div>
    )
  }

  return null
}

function buildForm(integration) {
  return { ...integration.config }
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}

function PlugIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2v4M15 2v4M9 8h6v3a3 3 0 0 1-3 3 3 3 0 0 1-3-3V8Z" />
      <path d="M12 14v4M9 21h6" />
    </svg>
  )
}

function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
