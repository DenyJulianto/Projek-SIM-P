// Struktur perangkat ajar (RPP K13 / Modul Ajar Kurikulum Merdeka) di sisi
// frontend. Harus sejalan dengan Backend/app/Support/StrukturPerangkatAjar.php
// (pembersihan isian, cek kelengkapan saat diajukan, dokumen PDF/Word).

export const KURIKULUM_META = {
  merdeka: { label: 'Kurikulum Merdeka', short: 'Modul Ajar', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  k13: { label: 'Kurikulum 2013', short: 'RPP 1 Lembar', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
}

export const STATUS_META = {
  draft: { label: 'Draf', badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  diajukan: { label: 'Menunggu Persetujuan', badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
  revisi: { label: 'Perlu Revisi', badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
  disetujui: { label: 'Disetujui', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
}

export const DIMENSI_PROFIL = [
  'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi',
]

export const TARGET_PESERTA = [
  'Peserta didik reguler / tipikal',
  'Peserta didik dengan kesulitan belajar',
  'Peserta didik dengan pencapaian tinggi',
]

export const TAHAP = {
  merdeka: [
    { k: 'pendahuluan', label: 'Pendahuluan', bantu: 'Salam, apersepsi, motivasi, penyampaian tujuan' },
    { k: 'memahami', label: 'Memahami', bantu: 'Peserta didik membangun pemahaman konsep secara bermakna' },
    { k: 'mengaplikasi', label: 'Mengaplikasi', bantu: 'Menerapkan pemahaman dalam konteks nyata / pemecahan masalah' },
    { k: 'merefleksi', label: 'Merefleksi', bantu: 'Mengevaluasi proses dan hasil belajar' },
    { k: 'penutup', label: 'Penutup', bantu: 'Kesimpulan, umpan balik, rencana pertemuan berikutnya' },
  ],
  k13: [
    { k: 'pendahuluan', label: 'Pendahuluan', bantu: 'Apersepsi, motivasi, penyampaian tujuan' },
    { k: 'inti', label: 'Kegiatan Inti', bantu: 'Eksplorasi materi sesuai model pembelajaran' },
    { k: 'penutup', label: 'Penutup', bantu: 'Kesimpulan, refleksi, materi pertemuan berikutnya' },
  ],
}

export const LANGKAH = {
  merdeka: [
    { k: 'identitas', label: 'Identitas' },
    { k: 'desain', label: 'Desain' },
    { k: 'kegiatan', label: 'Kegiatan' },
    { k: 'asesmen', label: 'Asesmen & Refleksi' },
    { k: 'lampiran', label: 'Lampiran' },
  ],
  k13: [
    { k: 'identitas', label: 'Identitas' },
    { k: 'desain', label: 'Tujuan' },
    { k: 'kegiatan', label: 'Kegiatan' },
    { k: 'asesmen', label: 'Penilaian' },
    { k: 'lampiran', label: 'Lampiran' },
  ],
}

// Field berformat (editor teks) per langkah. wajib: harus diisi sebelum diajukan.
export const FIELD = {
  merdeka: {
    desain: [
      { k: 'kompetensi_awal', label: 'Kompetensi Awal', bantu: 'Pengetahuan/keterampilan yang perlu dimiliki sebelum mempelajari topik ini' },
      { k: 'sarana_prasarana', label: 'Sarana dan Prasarana', bantu: 'Media, alat, dan bahan ajar' },
      { k: 'pemahaman_bermakna', label: 'Pemahaman Bermakna', bantu: 'Manfaat nyata materi bagi kehidupan sehari-hari' },
      { k: 'pertanyaan_pemantik', label: 'Pertanyaan Pemantik', bantu: 'Pertanyaan pembuka untuk memancing rasa ingin tahu' },
    ],
    pembelajaranMendalam: [
      { k: 'praktik_pedagogis', label: 'Praktik Pedagogis (Model / Metode)', bantu: 'mis. Project Based Learning; diskusi, demonstrasi', wajib: true },
      { k: 'kemitraan_pembelajaran', label: 'Kemitraan Pembelajaran', bantu: 'Kolaborasi dengan orang tua, komunitas, ahli, atau mitra lain' },
      { k: 'lingkungan_pembelajaran', label: 'Lingkungan Pembelajaran', bantu: 'Ruang fisik, virtual, dan budaya belajar yang dibangun' },
      { k: 'pemanfaatan_digital', label: 'Pemanfaatan Digital', bantu: 'Teknologi/platform digital yang digunakan' },
      { k: 'lintas_disiplin', label: 'Lintas Disiplin Ilmu', bantu: 'Keterkaitan dengan mata pelajaran lain' },
    ],
    kegiatan: [{ k: 'strategi_diferensiasi', label: 'Strategi Diferensiasi', bantu: 'Penyesuaian konten, proses, atau produk sesuai kebutuhan peserta didik' }],
    asesmen: [
      { k: 'asesmen_diagnostik', label: 'Asesmen Diagnostik (Awal)' },
      { k: 'asesmen_formatif', label: 'Asesmen Formatif (Proses)', wajib: true },
      { k: 'asesmen_sumatif', label: 'Asesmen Sumatif (Akhir)', wajib: true },
      { k: 'kktp', label: 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)' },
      { k: 'pengayaan', label: 'Pengayaan', bantu: 'Untuk peserta didik yang cepat mencapai tujuan' },
      { k: 'remedial', label: 'Remedial', bantu: 'Untuk peserta didik yang membutuhkan bimbingan' },
      { k: 'refleksi_guru', label: 'Refleksi Guru', bantu: 'Pertanyaan refleksi untuk guru setelah pembelajaran' },
      { k: 'refleksi_siswa', label: 'Refleksi Peserta Didik', bantu: 'Pertanyaan refleksi untuk peserta didik' },
      { k: 'glosarium', label: 'Glosarium' },
      { k: 'daftar_pustaka', label: 'Daftar Pustaka' },
    ],
  },
  k13: {
    desain: [
      { k: 'kompetensi_dasar', label: 'Kompetensi Dasar (KD)', wajib: true },
      { k: 'tujuan_pembelajaran', label: 'Tujuan Pembelajaran', bantu: 'Gunakan kata kerja operasional yang terukur', wajib: true },
    ],
    kegiatan: [],
    asesmen: [
      { k: 'penilaian_sikap', label: 'Penilaian Sikap', bantu: 'Observasi' },
      { k: 'penilaian_pengetahuan', label: 'Penilaian Pengetahuan', bantu: 'Tes tertulis / lisan', wajib: true },
      { k: 'penilaian_keterampilan', label: 'Penilaian Keterampilan', bantu: 'Unjuk kerja / proyek' },
    ],
  },
}

// Teks polos dari HTML editor (untuk cek "sudah diisi").
export function teksPolos(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = String(html).replace(/<(br|\/p|\/li|\/td)>/gi, ' ')
  return div.textContent.replace(/\s+/g, ' ').trim()
}

export function adalahHtml(teks) {
  return /<(p|br|ol|ul|li|table|b|strong|i|em|u|div)\b[^>]*>/i.test(teks || '')
}

const TAG_AMAN = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'OL', 'UL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'])
const TAG_BUANG = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE', 'NOSCRIPT', 'TITLE', 'META', 'LINK'])

// Pembersih HTML sisi klien (pertahanan berlapis; server tetap membersihkan
// ulang). Teks biasa dari data lama di-escape dan baris barunya dipertahankan.
export function htmlAman(teks) {
  if (!teks) return ''
  if (!adalahHtml(teks)) {
    const div = document.createElement('div')
    div.textContent = String(teks)
    return div.innerHTML.replace(/\n/g, '<br>')
  }
  const doc = new DOMParser().parseFromString(`<div>${teks}</div>`, 'text/html')
  const akar = doc.body.firstChild
  const saring = (node) => {
    for (const anak of [...node.childNodes]) {
      if (anak.nodeType === 1) {
        if (TAG_BUANG.has(anak.tagName)) {
          anak.remove()
          continue
        }
        saring(anak)
        if (TAG_AMAN.has(anak.tagName)) {
          for (const attr of [...anak.attributes]) anak.removeAttribute(attr.name)
        } else if (anak.tagName === 'DIV') {
          const p = doc.createElement('p')
          while (anak.firstChild) p.appendChild(anak.firstChild)
          anak.replaceWith(p)
        } else {
          anak.replaceWith(...anak.childNodes)
        }
      } else if (anak.nodeType !== 3) {
        anak.remove()
      }
    }
  }
  saring(akar)
  return akar.innerHTML
}

// Fase Kurikulum Merdeka ditampilkan sebagai tingkat kelas supaya mudah
// dipahami; nilai yang disimpan tetap huruf fase (CP master per fase).
export const FASE = [
  { k: 'A', kelas: 'Kelas I–II' },
  { k: 'B', kelas: 'Kelas III–IV' },
  { k: 'C', kelas: 'Kelas V–VI' },
  { k: 'D', kelas: 'Kelas VII–IX' },
  { k: 'E', kelas: 'Kelas X' },
  { k: 'F', kelas: 'Kelas XI–XII' },
]

export function labelFase(k) {
  const f = FASE.find((x) => x.k === k)
  return f ? `${f.kelas} (Fase ${f.k})` : k ? `Fase ${k}` : ''
}

export function pertemuanKosong(kurikulum) {
  return { topik: '', tahap: Object.fromEntries(TAHAP[kurikulum].map((t) => [t.k, { isi: '', durasi: '' }])) }
}

const PETA_P3 = {
  'Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia': 'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Berkebinekaan global': 'Kewargaan',
  'Bergotong royong': 'Kolaborasi',
  Mandiri: 'Kemandirian',
  'Bernalar kritis': 'Penalaran Kritis',
  Kreatif: 'Kreativitas',
}

// Seragamkan data lama (format sebelum perombakan) agar bisa dibuka di form.
export function normalisasi(data, kurikulum) {
  const d = { ...(data || {}) }
  if (!d.dimensi_profil?.length && d.profil_pelajar?.length) {
    d.dimensi_profil = [...new Set(d.profil_pelajar.map((x) => PETA_P3[x]).filter(Boolean))]
  }
  if (d.target_peserta?.length) d.target_peserta = d.target_peserta.map((x) => String(x).replace('Siswa ', 'Peserta didik '))
  if (!d.pertemuan?.length) {
    const p = pertemuanKosong(kurikulum)
    const inti = kurikulum === 'merdeka' ? 'memahami' : 'inti'
    p.tahap.pendahuluan.isi = d.pendahuluan || ''
    p.tahap[inti].isi = d.kegiatan_inti || ''
    p.tahap.penutup.isi = d.penutup || ''
    d.pertemuan = [p]
  }
  d.alokasi = { pertemuan: '', jp: '', menit_per_jp: '', ...(d.alokasi || {}) }
  return d
}

// Daftar kekurangan per langkah sebelum diajukan (sama dengan cek di server).
export function kekurangan(form, kurikulum) {
  const d = form.data
  const hasil = { identitas: [], desain: [], kegiatan: [], asesmen: [], lampiran: [] }
  if (!form.judul?.trim()) hasil.identitas.push('Judul')
  if (!form.mata_pelajaran_id) hasil.identitas.push('Mata pelajaran')
  if (!form.kelas_id) hasil.identitas.push('Kelas')
  if (!d.semester) hasil.identitas.push('Semester')
  const a = d.alokasi || {}
  if (!a.pertemuan || !a.jp || !a.menit_per_jp) hasil.identitas.push('Alokasi waktu')
  if (kurikulum === 'merdeka') {
    if (!d.cp_ids?.length) hasil.desain.push('Capaian pembelajaran')
    if (!d.tp_ids?.length && !teksPolos(d.tujuan_pembelajaran)) hasil.desain.push('Tujuan pembelajaran')
    if (!d.dimensi_profil?.length) hasil.desain.push('Dimensi profil lulusan')
  } else if (!d.materi_pokok?.trim()) hasil.identitas.push('Materi pokok')
  if (kurikulum === 'k13') {
    if (!String(d.kkm || '').trim()) hasil.desain.push('KKM')
    if (!d.model_pembelajaran?.trim()) hasil.kegiatan.push('Model pembelajaran')
  }
  for (const [langkah, daftar] of Object.entries(FIELD[kurikulum])) {
    const target = langkah === 'pembelajaranMendalam' ? 'desain' : langkah
    for (const f of daftar) if (f.wajib && !teksPolos(d[f.k])) hasil[target].push(f.label)
  }
  if (!d.pertemuan?.length) hasil.kegiatan.push('Minimal 1 pertemuan')
  ;(d.pertemuan || []).forEach((p, i) => {
    for (const t of TAHAP[kurikulum]) if (!teksPolos(p.tahap?.[t.k]?.isi)) hasil.kegiatan.push(`Pertemuan ${i + 1}: ${t.label}`)
  })
  return hasil
}

export function namaFileModul(modul, format) {
  const jenis = modul.kurikulum === 'merdeka' ? 'modul-ajar' : 'rpp'
  const slug = (modul.judul || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${jenis}-${slug || modul.id || 'baru'}.${format}`
}

export function teksAlokasi(d) {
  const a = d?.alokasi || {}
  if (a.pertemuan && a.jp && a.menit_per_jp) {
    return `${a.pertemuan} pertemuan × ${a.jp} JP × ${a.menit_per_jp} menit (${a.pertemuan * a.jp * a.menit_per_jp} menit)`
  }
  return d?.alokasi_waktu || ''
}

export function formatUkuran(byte) {
  if (byte >= 1048576) return `${(byte / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(byte / 1024))} KB`
}
