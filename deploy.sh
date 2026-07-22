#!/bin/bash
set -e
cd /Users/saidumarbek215.com/telegram-mini-shop
git add .
git commit -m "$1"
git push
cd client
npm run build
npx wrangler pages deploy dist --project-name telegram-mini-shop --commit-dirty=true
echo "✅ Backend va Frontend muvaffaqiyatli deploy qilindi"
