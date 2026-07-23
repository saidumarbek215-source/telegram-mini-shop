/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        accent: '#00E5CC',
        muted: 'var(--muted)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 204, 0.25)',
      },
    },
  },
  plugins: [],
}
