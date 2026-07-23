/** @type {import('tailwindcss').Config} */
// Цвета меняй в src/config.js → SITE_CONFIG.colors
// После изменения запусти: npm run build
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#111111',
        accent: '#FFE000',
        'accent-hover': '#e6cc00',
        'brand-red': '#CC0000',
      },
    },
  },
  plugins: [],
}
