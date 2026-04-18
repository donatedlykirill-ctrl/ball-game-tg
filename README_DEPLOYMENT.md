# 🎮 Ball Arena Game - Полный Stack

**Статус**: ✅ Готово к production деплою

## 🚀 Быстрый старт (11 минут)

### Шаг 1: GitHub (5 минут)
```powershell
# 1. Создай репо на https://github.com/new
#    Name: ball-game-tg, Public, Add .gitignore (Node)

# 2. Скопируй URL и выполни:
git remote add origin https://github.com/USERNAME/ball-game-tg.git
git push -u origin main

# 3. При запросе пароля → https://github.com/settings/tokens → Generate token
```

### Шаг 2: Backend на Vercel (3 минуты)
```
Vercel.com → Import Project → GitHub → ball-game-tg
Root: backend
Env: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT
Deploy → Скопируй URL
```

### Шаг 3: Frontend на Vercel (3 минуты)
```
Vercel.com → Add Project → GitHub → ball-game-tg
Root: .
Env: VITE_APP_API_URL=https://backend-url-from-step2
Deploy → Открой URL
```

✅ **Готово!** Твоя игра live!

---

## 📚 Документация

| Файл | Описание |
|------|---------|
| [FINAL_DEPLOYMENT.md](./FINAL_DEPLOYMENT.md) | 📋 Полное руководство |
| [TODO_NEXT.md](./TODO_NEXT.md) | ✅ Чек-лист действий |
| [GITHUB_QUICK.txt](./GITHUB_QUICK.txt) | 🚀 Быстрый старт |
| [backend/README.md](./backend/README.md) | 🔧 API документация |

---

## 🏗️ Архитектура

```
Frontend (React + Vite)
    ↓ HTTP API
Backend (Node.js + Express)
    ↓ SQL запросы
MySQL DB (Хостинг)
```

### API Endpoints

```
Игрок
  POST /api/player              - Create/update
  GET /api/player/:id           - Load data

Прогресс
  POST /api/save-progress       - Save stats
  POST /api/save-round          - Save history

Статистика
  GET /api/leaderboard          - Top 10
  GET /api/player-stats/:id     - Player history
```

---

## 💾 Что сохраняется

✅ Очки (coins)  
✅ Побед (wins)  
✅ Раундов (rounds)  
✅ Рекорд (highest_score)  
✅ Апгрейды (purchased)  
✅ История раундов (timestamp, duration, items)  

---

## 📊 БД схема

```sql
players
├── player_id (UUID)
├── username (VARCHAR)
├── total_coins
├── total_wins
├── total_rounds
├── highest_score

player_upgrades
├── player_id (FK)
├── upgrade_id
├── purchase_count

round_history
├── player_id (FK)
├── round_number
├── coins_earned
├── items_collected
├── items_taken
├── upgrades_used
└── duration_seconds
```

---

## 🎯 Текущие MySQL Credentials

```
Host: 127.0.0.1
Port: 3308
User: aruvaworkg
Pass: jCc-Urj-Sba-G3i
DB: aruvaworkg
```

---

## 🛠️ Локальная разработка

### Frontend
```bash
npm install
npm run dev
# http://localhost:5173
```

### Backend
```bash
cd backend
npm install
npm run dev
# http://localhost:3000
```

### Обновить .env
```env
VITE_APP_API_URL=http://localhost:3000
```

---

## 🔄 Production обновления

```bash
# Сделай изменения
git add .
git commit -m "Описание"
git push
# ✨ Vercel автоматически перестроит оба проекта
```

---

## 🎮 Как играть

1. Открой frontend URL
2. Нажми **Play**
3. Наведи мышь на синий мяч
4. Нажми **Launch**
5. Соби фрукты, избегай врагов
6. После раунда → данные в БД ✅

---

## ✨ Особенности

- 🎲 2-игроковый арена баттл
- 🛡️ Система апгрейдов
- 💰 Система монет
- 📊 Полная статистика
- ☁️ Cloud-первый подход
- 📱 Responsive дизайн

---

## 🚀 Состояние

```
✅ Frontend (React + Vite)
✅ Backend (Node.js + Express)
✅ MySQL интеграция
✅ API endpoints
✅ Git готов
✅ Vercel готов
⏳ Твой деплой!
```

---

## 📞 Контакты

**Backend**: `https://ball-game-backend-xxx.vercel.app`  
**Frontend**: `https://ball-game-frontend-xxx.vercel.app`  
**GitHub**: `https://github.com/USERNAME/ball-game-tg`

---

**🎉 Готово к запуску! Следуй FINAL_DEPLOYMENT.md** 🚀
