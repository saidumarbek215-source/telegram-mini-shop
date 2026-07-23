// ============================================
//  ОСНОВНЫЕ НАСТРОЙКИ САЙТА
//  Меняй здесь — изменится везде автоматически
// ============================================

export const SITE_CONFIG = {

  // --- Цвета ---
  colors: {
    primary: '#000000',       // Чёрный фон (хедер, футер, сплэш) — Boston стиль
    accent: '#FFE000',        // Жёлтый акцент (кнопки, лого)
    accentHover: '#e6cc00',   // Акцент при наведении
    secondary: '#111111',     // Вторичный фон
    red: '#CC0000',           // Красный — для подзаголовков (telefon bozor)
  },

  // --- Сплэш экран ---
  splash: {
    duration: 0,              // 0 = выключен. 3000 = 3 секунды
    logoUrl: 'https://i.postimg.cc/63GkxmFs/Bez-imeni-3.jpg', // Логотип Boston
  },

  // --- Каталог ---
  catalog: {
    productsPerPage: 20,      // Сколько товаров показывать на главной
    gridCols: {
      mobile: 2,              // Колонок на телефоне
      tablet: 3,              // Колонок на планшете
      desktop: 4,             // Колонок на десктопе
    },
  },

  // --- Методы оплаты (показывать / скрывать) ---
  paymentMethods: [
    { value: 'card',  label: 'Karta',  enabled: true },
    { value: 'cash',  label: 'Naqd',   enabled: true },
    { value: 'click', label: 'Click',  enabled: true },
    { value: 'payme', label: 'Payme',  enabled: true },
    { value: 'uzum',  label: 'Uzum',   enabled: true },
  ],

  // --- Навигация (нижняя + хедер) ---
  navLinks: [
    { label: 'Katalog',     path: '/catalog' },
    { label: 'Mashhur',     path: '/catalog?sort=popular' },
    { label: 'Yangiliklar', path: '/catalog?sort=new' },
  ],

  // --- Футер ---
  footer: {
    showTelegram: true,       // Показывать ссылку на Telegram бота
    showInstagram: false,     // Показывать Instagram (добавь username ниже)
    instagramUsername: '',    // Например: 'myshop_uz'
  },

}
