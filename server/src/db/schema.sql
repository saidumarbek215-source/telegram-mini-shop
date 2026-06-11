-- Sneaker Store schema

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '👟',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  price        NUMERIC(12, 2) NOT NULL,
  old_price    NUMERIC(12, 2),
  image_url    TEXT NOT NULL,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sizes        TEXT[] NOT NULL DEFAULT '{}',
  colors       TEXT[] NOT NULL DEFAULT '{}',
  in_stock     BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id          SERIAL PRIMARY KEY,
  image_url   TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  subtitle    TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  telegram_user_id   BIGINT,
  telegram_username  TEXT,
  customer_name      TEXT NOT NULL,
  phone              TEXT NOT NULL,
  address            TEXT NOT NULL,
  comment            TEXT NOT NULL DEFAULT '',
  total              NUMERIC(12, 2) NOT NULL,
  status             TEXT NOT NULL DEFAULT 'new',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  image_url     TEXT NOT NULL DEFAULT '',
  price         NUMERIC(12, 2) NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  size          TEXT,
  color         TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_user ON orders(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
