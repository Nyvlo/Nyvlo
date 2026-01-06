/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color, #10b981)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color, #059669)',
          foreground: '#ffffff',
        },
        background: '#f8fafc',
        foreground: '#1e293b',
        muted: '#f1f5f9',
        border: '#e2e8f0',
      }
    },
  },
  plugins: [],
}
