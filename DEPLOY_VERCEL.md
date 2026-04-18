# 🚀 Деплой на Vercel - Пошаговая инструкция

## Часть 1️⃣: Деплой Backend (Node.js API)

### Шаг 1: Подготовка

1. **Установи Vercel CLI**
```bash
npm install -g vercel
```

2. **Перейди в папку backend**
```bash
cd backend
```

3. **Убедись что есть `.env.example`**
```bash
# Проверь содержимое
cat .env.example
```

### Шаг 2: Деплой на Vercel

```bash
# Залогинься в Vercel (первый раз)
vercel login

# Деплой (из папки backend)
vercel --prod
```

**При вопросах отвечай:**
- "Set up and deploy?" → **Y** (Yes)
- "Which scope?" → Выбери свой аккаунт
- "Link to existing Project?" → **N** (No) - первый раз
- "What's your project's name?" → ball-game-backend (или любое другое)
- "In which directory is your code?" → . (текущая папка backend)

### Шаг 3: Добавь переменные окружения в Vercel

После деплоя ты получишь URL, например:
```
🔗 https://ball-game-backend-xxx.vercel.app
```

Теперь добавь переменные:

**Способ 1: Через веб-интерфейс (проще)**
1. Открой https://vercel.com/dashboard
2. Найди проект `ball-game-backend`
3. Перейди в **Settings** → **Environment Variables**
4. Добавь каждую переменную:
   ```
   MYSQL_HOST = 127.0.0.1
   MYSQL_USER = aruvaworkg
   MYSQL_PASSWORD = jCc-Urj-Sba-G3i
   MYSQL_DATABASE = aruvaworkg
   MYSQL_PORT = 3308
   NODE_ENV = production
   PORT = 3000
   ```

**Способ 2: Через CLI**
```bash
vercel env add MYSQL_HOST 127.0.0.1
vercel env add MYSQL_USER aruvaworkg
vercel env add MYSQL_PASSWORD jCc-Urj-Sba-G3i
vercel env add MYSQL_DATABASE aruvaworkg
vercel env add MYSQL_PORT 3308
vercel env add NODE_ENV production
```

### Шаг 4: Перед окончанием редеплоя

```bash
# Редеплой чтобы применить переменные окружения
vercel --prod
```

✅ **Backend готов!** Скопируй URL: `https://ball-game-backend-xxx.vercel.app`

---

## Часть 2️⃣: Деплой Frontend (React + Vite)

### Шаг 1: Подготовка фронтенда

```bash
# Вернись в корень проекта
cd ..

# Создай .env.production с URL backend
echo "VITE_APP_API_URL=https://ball-game-backend-xxx.vercel.app" > .env.production
```

**Замени `xxx` на твой реальный ID из backend URL!**

### Шаг 2: Деплой frontend

```bash
# Из корня проекта (BALL GAME TG)
vercel --prod
```

**При вопросах:**
- "Set up and deploy?" → **Y**
- "Which scope?" → Выбери свой аккаунт
- "Link to existing Project?" → **N** (или **Y** если хочешь в один проект)
- "What's your project's name?" → ball-game-frontend (или ball-game общий)
- "In which directory is your code?" → . (текущая папка)
- "Want to override the settings?" → **Y** (Yes)
- "Which settings?" → Выбери build settings

### Шаг 3: Добавь переменные окружения

1. Открой https://vercel.com/dashboard
2. Найди проект frontend
3. **Settings** → **Environment Variables**
4. Добавь:
   ```
   VITE_APP_API_URL = https://ball-game-backend-xxx.vercel.app
   ```

### Шаг 4: Редеплой

```bash
vercel --prod
```

✅ **Frontend готов!** Получишь URL: `https://ball-game-frontend-xxx.vercel.app`

---

## ✅ Проверка что всё работает

1. **Открой frontend**: `https://ball-game-frontend-xxx.vercel.app`
2. **Сыграй раунд** - должны сохраниться данные
3. **Открой DevTools** (F12 → Network)
4. **Посмотри запросы** - должны идти на backend URL

Если видишь ошибку "Failed to load player":
- Проверь VITE_APP_API_URL в frontend Settings
- Проверь MySQL credentials в backend Settings
- Убедись что MySQL хост доступен (может быть блокирован)

---

## 🔄 Как обновлять после этого

**Обновить backend:**
```bash
cd backend
# Сделай изменения в коде
git add .
git commit -m "Update backend"
vercel --prod
```

**Обновить frontend:**
```bash
# Из корня
# Сделай изменения
git add .
git commit -m "Update frontend"
vercel --prod
```

Или просто нажми на Vercel Dashboard кнопку **Redeploy** →

---

## 🎯 Если возникли проблемы

### "Build failed"
1. Проверь `package.json` scripts
2. Убедись что все dependencies установлены
3. Посмотри Build logs в Vercel Dashboard

### "Cannot connect to database"
1. Проверь MySQL_HOST и credentials
2. Может быть, нужен IP whitelist в MySQL хостинге
3. Убедись PORT правильный (обычно 3306, но может быть 3308 или другой)

### "API returns 500"
1. Посмотри Vercel Logs (`vercel logs`)
2. Проверь `.env` переменные правильные
3. Перезапусти backend: `vercel --prod`

### "Можно ли объединить в один проект?"
Да! При деплое frontend выбери "Link to existing Project" и выбери backend проект. Но рекомендуется отдельные проекты для backend и frontend.

---

## 📋 Итоговые URL'ы

После успешного деплоя у тебя будет:

| Компонент | URL |
|-----------|-----|
| **Backend API** | `https://ball-game-backend-xxx.vercel.app` |
| **Frontend** | `https://ball-game-frontend-xxx.vercel.app` |
| **Vercel Dashboard** | https://vercel.com/dashboard |

✅ **Готово! Твоя игра живет в интернете!** 🎮
