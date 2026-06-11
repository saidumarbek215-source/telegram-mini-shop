/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0F1A',
        surface: '#121826',
        surface2: '#1A2236',
        accent: '#00E5CC',
        muted: '#8A93A6',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 204, 0.25)',
      },
    },
  },
  plugins: [],
}
