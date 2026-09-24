function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function downloadCsv(filename, header, rows) {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(','))
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
