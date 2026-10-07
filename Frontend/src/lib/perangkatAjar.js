// Struktur perangkat ajar (RPP K13 / Modul Ajar Kurikulum Merdeka Belajar
// RPP+) di sisi frontend. Harus sejalan dengan
// Backend/app/Support/StrukturPerangkatAjar.php (pembersihan isian, cek
// kelengkapan saat diajukan, dokumen PDF/Word).

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

/** 6 dimensi Profil Pelajar Pancasila. */
export const PROFIL_PELAJAR = [
  'Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia',
  'Berkebinekaan global',
  'Bergotong royong',
  'Mandiri',
  'Bernalar kritis',
  'Kreatif',
]

export const TARGET_PESERTA = [
  'Peserta didik reguler / tipikal',
  'Peserta didik berkebutuhan khusus',
  'Peserta didik pencapaian tinggi (pengayaan)',
]

export const MODA = ['Tatap muka', 'Daring', 'Blended (tatap muka dan daring)']

export const METODE = ['Ceramah', 'Tanya jawab', 'Diskusi', 'Demonstrasi', 'Penugasan']

export const RUMUS_NILAI_BAWAAN = 'Nilai = (skor perolehan ÷ skor maksimal) × 100'

// Kerangka isian yang bisa disisipkan guru (tombol "Sisipkan kerangka") —
// tidak diisikan otomatis supaya cek "wajib diisi" tetap bermakna.
const KERANGKA_PENDAHULUAN =
  '<ol><li>Pengkondisian kelas dan presensi: </li><li>Berdoa bersama: </li><li>Literasi / ice breaking: </li>' +
  '<li>Apersepsi: </li><li>Pertanyaan pemantik: </li><li>Menyampaikan tujuan, langkah, dan jenis asesmen: </li></ol>'
const KERANGKA_INTI =
  '<p><b>Langkah sesuai sintaks model pembelajaran:</b></p><ol><li>Tahap 1 – … : kegiatan peserta didik …; peran guru …</li>' +
  '<li>Tahap 2 – … : kegiatan peserta didik …; peran guru …</li><li>Tahap 3 – … : kegiatan peserta didik …; peran guru …</li></ol>' +
  '<p><b>Catatan / tips guru:</b> </p>'
const KERANGKA_PENUTUP =
  '<ol><li>Refleksi: </li><li>Menyimpulkan materi: </li><li>Penguatan: </li><li>Asesmen hasil belajar: </li>' +
  '<li>Informasi pertemuan berikutnya: </li><li>Berdoa penutup: </li></ol>'

export const TAHAP = {
  merdeka: [
    {
      k: 'pendahuluan',
      label: 'Kegiatan Pendahuluan',
      bantu: '±10 menit — pengkondisian & presensi, doa, literasi/ice breaking, apersepsi, pertanyaan pemantik, tujuan & asesmen',
      durasi: 10,
      kerangka: KERANGKA_PENDAHULUAN,
    },
    {
      k: 'inti',
      label: 'Kegiatan Inti',
      bantu: '±50–85 menit — langkah sesuai sintaks model (mis. PBL), aktivitas peserta didik & peran guru, tips guru',
      kerangka: KERANGKA_INTI,
    },
    {
      k: 'penutup',
      label: 'Kegiatan Penutup',
      bantu: '±10 menit — refleksi, kesimpulan, penguatan, asesmen, informasi pertemuan berikutnya, doa',
      durasi: 10,
      kerangka: KERANGKA_PENUTUP,
    },
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
    { k: 'umum', label: 'Informasi Umum' },
    { k: 'inti', label: 'Komponen Inti' },
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

const RUBRIK_SIKAP =
  '<table><tbody><tr><th>Skor</th><th>Indikator</th></tr><tr><td>4 (Sangat baik)</td><td> </td></tr>' +
  '<tr><td>3 (Baik)</td><td> </td></tr><tr><td>2 (Cukup)</td><td> </td></tr><tr><td>1 (Perlu bimbingan)</td><td> </td></tr></tbody></table>' +
  '<p>Aspek sikap yang diamati: </p>'
const RUBRIK_PENGETAHUAN =
  '<table><tbody><tr><th>No.</th><th>Aspek / Kriteria</th><th>Ya / Skor</th></tr><tr><td>1</td><td> </td><td> </td></tr>' +
  '<tr><td>2</td><td> </td><td> </td></tr><tr><td>3</td><td> </td><td> </td></tr></tbody></table>'
const LKPD =
  '<p><b>Judul kegiatan:</b> </p><p><b>Tujuan:</b> </p><p><b>Petunjuk:</b></p><ol><li> </li></ol><p><b>Soal / tugas:</b></p><ol><li> </li></ol>'

// Field berformat (editor teks) per langkah. wajib: harus diisi sebelum diajukan.
export const FIELD = {
  merdeka: {
    umum: [
      { k: 'karakteristik_peserta', label: 'Karakteristik Peserta Didik', bantu: 'Gambaran umum kemampuan kelas (gaya belajar, minat, kesiapan)' },
      { k: 'sarana_prasarana', label: 'Sarana dan Prasarana', bantu: 'Media, alat, bahan, dan buku yang digunakan' },
    ],
    inti: {
      cp_umum: { k: 'cp_umum', label: 'Capaian Pembelajaran Umum (per Fase)', bantu: 'Opsional — rumusan CP umum fase; CP per elemen dipilih di bawah' },
      pemahaman_bermakna: { k: 'pemahaman_bermakna', label: 'Pemahaman Bermakna', bantu: 'Ringkasan konsep kunci yang diharapkan dipahami peserta didik' },
      materi_inti: { k: 'materi_inti', label: 'Materi Inti', bantu: 'Pokok materi yang dipelajari', wajib: true },
    },
    kegiatan: [{ k: 'kegiatan_alternatif', label: 'Kegiatan Alternatif', bantu: 'Opsional — bila media/alat utama tidak tersedia' }],
    asesmen: [
      { k: 'asesmen_diagnostik', label: 'Asesmen Diagnostik', bantu: 'Di awal pembelajaran: kesiapan & pengetahuan awal peserta didik' },
      { k: 'asesmen_formatif', label: 'Asesmen Formatif', bantu: 'Selama pembelajaran, mis. latihan soal, observasi, umpan balik', wajib: true },
      { k: 'asesmen_sumatif', label: 'Asesmen Sumatif', bantu: 'Akhir pembelajaran, mis. soal evaluasi', wajib: true },
    ],
    refleksi: [
      { k: 'refleksi_guru', label: 'Refleksi Guru', bantu: 'Keberhasilan, kesulitan, ketercapaian tujuan, strategi yang perlu diperbaiki' },
      { k: 'refleksi_siswa', label: 'Refleksi Peserta Didik', bantu: 'Pernyataan refleksi diri peserta didik' },
      { k: 'pemetaan_kemampuan', label: 'Pemetaan Kemampuan Peserta Didik', bantu: 'Untuk keperluan pembelajaran berdiferensiasi' },
      { k: 'interaksi_ortu', label: 'Interaksi dengan Orang Tua / Wali', bantu: 'Opsional — mis. materi untuk belajar di rumah' },
    ],
    lampiran: [
      { k: 'bahan_bacaan', label: 'Bahan Bacaan Guru dan Peserta Didik', bantu: 'Teks cerita, gambar, tabel materi' },
      { k: 'lkpd', label: 'Lembar Kerja Peserta Didik (LKPD)', bantu: 'Kolom nama dan nilai ditambahkan otomatis di dokumen', kerangka: LKPD },
      { k: 'rubrik_sikap', label: 'Rubrik Penilaian Sikap', bantu: 'Skor 1–4 dengan indikatornya', kerangka: RUBRIK_SIKAP },
      { k: 'rubrik_pengetahuan', label: 'Rubrik Penilaian Pengetahuan dan Keterampilan', bantu: 'Ceklis atau skala', kerangka: RUBRIK_PENGETAHUAN },
      { k: 'remedial', label: 'Remedial', bantu: 'Strategi bantuan bagi peserta didik yang mengalami kesulitan' },
      { k: 'pengayaan', label: 'Pengayaan', bantu: 'Kegiatan dan soal bagi peserta didik yang sudah menguasai materi' },
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
  return { topik: '', tahap: Object.fromEntries(TAHAP[kurikulum].map((t) => [t.k, { isi: '', durasi: t.durasi ?? '' }])) }
}

export function atpKosong(waktu = '') {
  return { waktu, kegiatan: '', kemampuan: '' }
}

/** Baris ATP yang lengkap (kegiatan & kemampuan terisi). */
export function atpLengkap(d) {
  return (d.atp || []).filter((a) => a.kegiatan?.trim() && a.kemampuan?.trim())
}

/** Kalimat ATP: "Melalui kegiatan …, peserta didik dapat …." */
export function kalimatAtp(a) {
  const kegiatan = a.kegiatan.trim().replace(/[ .,]+$/, '').replace(/^melalui kegiatan\s+/i, '')
  const kemampuan = a.kemampuan.trim().replace(/[ .]+$/, '').replace(/^peserta didik (dapat|mampu)\s+/i, '')
  const kecil = (s) => s.charAt(0).toLowerCase() + s.slice(1)
  return `Melalui kegiatan ${kecil(kegiatan)}, peserta didik dapat ${kecil(kemampuan)}.`
}

// Seragamkan data lama / data baru agar bisa dibuka di form.
export function normalisasi(data, kurikulum) {
  const d = { ...(data || {}) }
  if (!d.pertemuan?.length) {
    const p = pertemuanKosong(kurikulum)
    p.tahap.pendahuluan.isi = d.pendahuluan || ''
    p.tahap.inti.isi = d.kegiatan_inti || ''
    p.tahap.penutup.isi = d.penutup || ''
    d.pertemuan = [p]
  }
  d.alokasi = { pertemuan: '', jp: '', menit_per_jp: '', ...(d.alokasi || {}) }
  if (kurikulum === 'merdeka' && !d.atp?.length) d.atp = [atpKosong('Pertemuan 1')]
  return d
}

// Daftar kekurangan per langkah sebelum diajukan (sama dengan cek di server).
export function kekurangan(form, kurikulum) {
  const d = form.data
  const hasil = Object.fromEntries(LANGKAH[kurikulum].map((l) => [l.k, []]))
  if (!form.judul?.trim()) hasil.identitas.push('Judul')
  if (!form.mata_pelajaran_id) hasil.identitas.push('Mata pelajaran')
  if (!form.kelas_id) hasil.identitas.push('Kelas')
  if (!d.semester) hasil.identitas.push('Semester')
  const a = d.alokasi || {}
  if (!a.pertemuan || !a.jp || !a.menit_per_jp) hasil.identitas.push('Alokasi waktu')
  if (kurikulum === 'merdeka') {
    if (!d.tahun_ajaran?.trim()) hasil.identitas.push('Tahun ajaran')
    if (!d.moda) hasil.umum.push('Moda pembelajaran')
    if (!d.metode?.length && !d.metode_lain?.trim()) hasil.umum.push('Metode pembelajaran')
    if (!d.model_pembelajaran?.trim()) hasil.umum.push('Model pembelajaran')
    if (!d.profil_pelajar?.length) hasil.umum.push('Profil Pelajar Pancasila')
    if (!d.cp_ids?.length) hasil.inti.push('Capaian pembelajaran')
    if (!d.tp_ids?.length && !teksPolos(d.tujuan_pembelajaran)) hasil.inti.push('Tujuan pembelajaran')
    if (!atpLengkap(d).length) hasil.inti.push('Alur tujuan pembelajaran')
    if (!teksPolos(d.materi_inti)) hasil.inti.push('Materi inti')
    for (const f of FIELD.merdeka.asesmen) if (f.wajib && !teksPolos(d[f.k])) hasil.asesmen.push(f.label)
  } else {
    if (!d.materi_pokok?.trim()) hasil.identitas.push('Materi pokok')
    if (!String(d.kkm || '').trim()) hasil.desain.push('KKM')
    if (!d.model_pembelajaran?.trim()) hasil.kegiatan.push('Model pembelajaran')
    for (const [langkah, daftar] of Object.entries(FIELD.k13)) {
      for (const f of daftar) if (f.wajib && !teksPolos(d[f.k])) hasil[langkah].push(f.label)
    }
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
