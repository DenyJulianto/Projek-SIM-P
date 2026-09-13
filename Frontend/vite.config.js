import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Beberapa environment Windows membuat Vite hanya bind ke ::1 (IPv6)
    // kalau host tidak disebutkan eksplisit, sehingga http://127.0.0.1:5173
    // tidak bisa diakses meski http://localhost:5173 kelihatan jalan.
    // "127.0.0.1" memaksa bind IPv4 supaya konsisten di semua environment.
    host: '127.0.0.1',
  },
})
