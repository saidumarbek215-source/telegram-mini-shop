// ============================================
//  НАСТРОЙКИ САЙТА — берутся из .env
//  Для нового магазина просто поменяй .env
// ============================================

export const SITE_CONFIG = {

  // --- Брендинг (из .env) ---
  brand: {
    logoUrl:  import.meta.env.VITE_LOGO_URL  || '',   // URL логотипа
    color:    import.meta.env.VITE_COLOR     || '#FFE000', // Акцентный цвет
    colorBg:  import.meta.env.VITE_COLOR_BG || '#000000', // Цвет фона/шапки
  },

  // --- Цвета ---
  colors: {
    primary:     import.meta.env.VITE_COLOR_BG || '#000000',
    accent:      import.meta.env.VITE_COLOR    || '#FFE000',
    accentHover: '#e6cc00',
    secondary:   '#111111',
    red:         '#CC0000',
  },

  // --- Сплэш экран ---
  splash: {
    duration: 4000,   // 0 = выключен
    logoUrl:  import.meta.env.VITE_LOGO_URL || '',
  },

  // --- Каталог ---
  catalog: {
    productsPerPage: 20,
    gridCols: { mobile: 2, tablet: 3, desktop: 4 },
  },

  // --- Методы оплаты ---
  paymentMethods: [
    { value: 'card',  label: 'Karta',  enabled: true },
    { value: 'cash',  label: 'Naqd',   enabled: true },
    { value: 'click', label: 'Click',  enabled: true },
    { value: 'payme', label: 'Payme',  enabled: true },
    { value: 'uzum',  label: 'Uzum',   enabled: true },
  ],

  // --- Навигация ---
  navLinks: [
    { label: 'Katalog',     path: '/catalog' },
    { label: 'Mashhur',     path: '/catalog?sort=popular' },
    { label: 'Yangiliklar', path: '/catalog?sort=new' },
  ],

  // --- Футер ---
  footer: {
    showTelegram:     true,
    showInstagram:    false,
    instagramUsername: '',
  },

}
