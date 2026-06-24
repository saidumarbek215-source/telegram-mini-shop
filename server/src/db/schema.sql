-- Sneaker Store schema (multi-shop)

CREATE TABLE IF NOT EXISTS shops (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR(255),
  description        TEXT,
  owner_telegram_id  BIGINT UNIQUE,
  bot_token          VARCHAR(255),
  bot_username       VARCHAR(100),
  admin_username     VARCHAR(100),
  card_number        VARCHAR(50),
  card_holder        VARCHAR(100),
  click_number       VARCHAR(50),
  currency           VARCHAR(10) DEFAULT 'сум',
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMP DEFAULT NOW()
);

ALTER TABLE shops ADD COLUMN IF NOT EXISTS bot_username VARCHAR(100);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS ai_connected BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS product_unit_type VARCHAR(20) DEFAULT 'size';

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  shop_id     INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '👟',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Adds shop_id to existing databases created before this column existed
ALTER TABLE categories ADD COLUMN IF NOT EXISTS shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  shop_id      INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  price        NUMERIC(12, 2) NOT NULL,
  old_price    NUMERIC(12, 2),
  image_url    TEXT NOT NULL,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sizes        TEXT[] NOT NULL DEFAULT '{}',
  colors       TEXT[] NOT NULL DEFAULT '{}',
  sizes_stock  JSONB NOT NULL DEFAULT '{}'::jsonb,
  in_stock     BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adds columns to existing databases created before they existed
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes_stock JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS banners (
  id          SERIAL PRIMARY KEY,
  shop_id     INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  subtitle    TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE banners ADD COLUMN IF NOT EXISTS shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS settings;

CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  shop_id            INTEGER REFERENCES shops(id) ON DELETE CASCADE,
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

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE;

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

CREATE TABLE IF NOT EXISTS partners (
  id          SERIAL PRIMARY KEY,
  shop_id     INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_categories_shop ON categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_banners_shop ON banners(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_user ON orders(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_partners_shop ON partners(shop_id);
