# Ball Game TG - Complete Setup Guide

Полное руководство по настройке игры Ball Arena с MySQL базой данных.

## 📋 Структура проекта

```
BALL GAME TG/
├── src/                    # Frontend (React + Vite)
│   ├── App.tsx            # Main game component
│   ├── utils/
│   │   ├── api.ts         # API client for backend
│   │   └── cn.ts          # Utility functions
│   ├── main.tsx
│   └── index.css
├── backend/               # Backend (Node.js + Express)
│   ├── server.js         # Express server
│   ├── schema.sql        # Database schema
│   ├── .env.example      # Environment variables example
│   ├── vercel.json       # Vercel deployment config
│   └── package.json
├── package.json          # Frontend dependencies
├── vite.config.ts
├── tsconfig.json
├── .env.example          # Frontend env example
└── README.md
```

## 🚀 Быстрый старт

### Вариант 1: Локальная разработка

#### Frontend (локально)

```bash
# Скопируй .env.example в .env
cp .env.example .env

# Установи зависимости
npm install

# Запусти dev сервер
npm run dev
```

Фронтенд будет доступен на `http://localhost:5173`

#### Backend (локально)

```bash
cd backend

# Скопируй .env.example в .env
cp .env.example .env

# Заполни переменные окружения в .env
# MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD и т.д.

# Установи зависимости
npm install

# Запусти server
npm run dev
```

Backend будет на `http://localhost:3000`

Обнови `.env` в корне проекта:
```env
VITE_APP_API_URL=http://localhost:3000
```

---

### Вариант 2: Production деплой

#### Шаг 1: Настройка базы данных

##### Используя PlanetScale (рекомендуется, бесплатно)

1. Зарегистрируйся на https://planetscale.com
2. Создай новую базу данных
3. Получи MySQL connection string
4. Запусти схему:
   ```sql
   mysql -h <host> -u <user> -p < backend/schema.sql
   ```

##### Или используя другие хостинги:
- **Azure Database for MySQL** - https://azure.microsoft.com/en-us/services/mysql/
- **AWS RDS** - https://aws.amazon.com/rds/mysql/
- **Google Cloud SQL** - https://cloud.google.com/sql/mysql

#### Шаг 2: Деплой Backend на Vercel

```bash
cd backend

# Установи Vercel CLI
npm i -g vercel

# Деплой
vercel
```

После деплоя ты получишь URL, похожий на:
```
https://ball-game-backend-xxx.vercel.app
```

Добавь environment variables в Vercel Project Settings:
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_PORT`

#### Шаг 3: Деплой Frontend

```bash
# Обнови .env с production backend URL
echo "VITE_APP_API_URL=https://ball-game-backend-xxx.vercel.app" > .env.production

# Build
npm run build

# Деплой (например, на Vercel)
vercel --prod
```

---

## 🔧 Переменные окружения

### Frontend (.env)

```env
# API URL для подключения к backend
VITE_APP_API_URL=http://localhost:3000

# Для production:
# VITE_APP_API_URL=https://your-backend-url.vercel.app
```

### Backend (.env)

```env
# MySQL Connection
MYSQL_HOST=your-planetscale-host.mysql.database.cloud
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=ball_game_db
MYSQL_PORT=3306

# Server
PORT=3000
NODE_ENV=production
```

---

## 📡 API Endpoints

### 1. Инициализировать игрока
```
POST /api/player
Content-Type: application/json

{
  "playerId": "user123",
  "username": "My Username"
}
```

### 2. Загрузить данные игрока
```
GET /api/player/:playerId

Response:
{
  "player": { ... },
  "upgrades": [ ... ],
  "stats": [ ... ]
}
```

### 3. Сохранить прогресс
```
POST /api/save-progress

{
  "playerId": "user123",
  "coins": 100,
  "roundsPlayed": 5,
  "wins": 2,
  "highestScore": 150,
  "itemsCollected": 50,
  "itemsTaken": 10,
  "selectedUpgrades": ["turbo_start", "guard_shell"]
}
```

### 4. Сохранить раунд
```
POST /api/save-round

{
  "playerId": "user123",
  "roundNumber": 5,
  "coinsEarned": 20,
  "itemsCollected": 15,
  "itemsTaken": 2,
  "upgradesUsed": ["turbo_start"],
  "durationSeconds": 120,
  "won": true
}
```

### 5. Получить лидерборд
```
GET /api/leaderboard?limit=10

Response: [ { username, total_coins, highest_score, ... } ]
```

---

## 🗄️ Структура базы данных

### players
- `id` - Primary Key
- `player_id` - Unique ID игрока
- `username` - Имя игрока
- `total_coins` - Всего монет
- `total_rounds` - Всего раундов
- `total_wins` - Побед
- `highest_score` - Максимальный счет
- `items_collected` - Собранных предметов
- `items_taken` - Полученных урона
- `created_at` - Когда создан
- `last_played_at` - Последний раз играл

### player_upgrades
- Хранит покупки апгрейдов каждого игрока
- `player_id` - FK на players
- `upgrade_id` - ID апгрейда
- `purchase_count` - Сколько раз куплен

### round_history
- История каждого раунда
- Хранит подробные данные о каждой игре

---

## 🛠️ Troubleshooting

### "Failed to connect to API"
- Проверь, что backend запущен: `curl http://localhost:3000/health`
- Проверь `VITE_APP_API_URL` в `.env`
- Проверь CORS ошибки в консоли браузера

### "Unknown database"
- Запусти `schema.sql`: `mysql -h <host> -u <user> -p < backend/schema.sql`
- Проверь имя БД в `MYSQL_DATABASE`

### "Connection timeout"
- Проверь MYSQL_HOST и credentials
- Убеди, что MySQL доступен (открыт порт 3306)
- Для хостинга: проверь IP whitelist

### "Player data not loading"
- Откройи DevTools → Network → посмотри ответ от `/api/player/:playerId`
- Проверь console for API errors
- Убеди, что backend сохраняет данные: `SELECT * FROM players;`

---

## 📊 Мониторинг

### Проверить текущих игроков
```sql
SELECT username, total_coins, total_wins, highest_score 
FROM players 
ORDER BY highest_score DESC;
```

### Посмотреть историю раундов
```sql
SELECT * FROM round_history 
WHERE player_id = 'user123' 
ORDER BY played_at DESC;
```

### Проверить апгрейды
```sql
SELECT * FROM player_upgrades 
WHERE player_id = 'user123';
```

---

## 🎮 Как играть

1. Открыти приложение
2. Нажми **Play** для начала игры
3. Наведи мышь на синий мяч для прицеливания
4. Нажми **Launch** чтобы запустить
5. После раунда, данные сохранятся в БД
6. Посмотри **Stats** на главном экране

---

## 📝 Примечания

- Локальный player_id генерируется автоматически и сохраняется в localStorage
- Данные игры сохраняются в MySQL после каждого раунда
- Лидерборд можно добавить в UI позже
- Для Telegram интеграции: используй webhook с `TELE_BOT_TOKEN`

---

## ❓ Помощь

При ошибках:
1. Проверь консоль браузера (F12 → Console)
2. Проверь backend логи: `npm run dev` в терминале
3. Проверь connect к БД:试试 `mysql -h <host> -u <user> -p <password> -e "SELECT 1;"`
