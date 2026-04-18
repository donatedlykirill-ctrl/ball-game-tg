# Ball Game Backend

Backend для Ball Game TG с MySQL базой данных на хостинге.

## 🚀 Быстрый старт

### 1️⃣ Подготовка MySQL хостинга

Рекомендуемые варианты:
- **PlanetScale** (бесплатный MySQL хостинг) - https://planetscale.com
- **Azure Database for MySQL** - https://azure.microsoft.com
- **Vercel + MySQL** (через интеграции)

#### Используя PlanetScale (рекомендуется):

1. Зарегистрируйся на https://planetscale.com
2. Создай новую базу данных (нажми "Create a new database")
3. Получи connection string и скопируй учетные данные
4. Запусти схему:
   ```bash
   mysql -h <host> -u <user> -p < schema.sql
   ```

### 2️⃣ Конфигурация локально

1. Скопируй `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

2. Заполни переменные окружения:
   ```env
   MYSQL_HOST=your-host.mysql.database.azure.com
   MYSQL_USER=your-user
   MYSQL_PASSWORD=your-password
   MYSQL_DATABASE=ball_game_db
   MYSQL_PORT=3306
   PORT=3000
   ```

3. Установи зависимости:
   ```bash
   npm install
   ```

4. Запусти локально:
   ```bash
   npm run dev
   ```

Сервер будет доступен на `http://localhost:3000`

### 3️⃣ Деплой на Vercel

1. Установи Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Деплой:
   ```bash
   vercel
   ```

3. Добавь переменные окружения в Vercel Project Settings (Environment Variables):
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `MYSQL_PORT`

4. Скопируй production URL (будет выглядеть как `https://your-project.vercel.app`)

## 📡 API Endpoints

### 1. Получить данные игрока
```
GET /api/player/:playerId
```
**Response:**
```json
{
  "player": { "id": 1, "player_id": "user123", "total_coins": 100, ... },
  "upgrades": [{ "upgrade_id": "turbo_start", "purchase_count": 2 }],
  "stats": [{ "round_number": 1, "coins_earned": 50, ... }]
}
```

### 2. Создать/обновить игрока
```
POST /api/player
Content-Type: application/json

{
  "playerId": "user123",
  "username": "Player Name"
}
```

### 3. Сохранить прогресс игры
```
POST /api/save-progress
Content-Type: application/json

{
  "playerId": "user123",
  "coins": 150,
  "roundsPlayed": 5,
  "wins": 1,
  "highestScore": 200,
  "itemsCollected": 25,
  "itemsTaken": 3,
  "selectedUpgrades": ["turbo_start", "guard_shell"]
}
```

### 4. Сохранить историю раунда
```
POST /api/save-round
Content-Type: application/json

{
  "playerId": "user123",
  "roundNumber": 5,
  "coinsEarned": 50,
  "itemsCollected": 10,
  "itemsTaken": 2,
  "upgradesUsed": ["turbo_start"],
  "durationSeconds": 120,
  "won": true
}
```

### 5. Получить лидерборд
```
GET /api/leaderboard?limit=10
```

### 6. Получить статистику игрока
```
GET /api/player-stats/:playerId
```

## 🗄️ Структура БД

```
players
├── id (INT, PK)
├── player_id (VARCHAR, UNIQUE)
├── username (VARCHAR)
├── total_coins (INT)
├── total_rounds (INT)
├── total_wins (INT)
├── highest_score (INT)
├── items_collected (INT)
├── items_taken (INT)
└── created_at, last_played_at (TIMESTAMP)

player_upgrades
├── id (INT, PK)
├── player_id (FK)
├── upgrade_id (VARCHAR)
├── purchase_count (INT)
└── created_at (TIMESTAMP)

round_history
├── id (INT, PK)
├── player_id (FK)
├── round_number (INT)
├── coins_earned (INT)
├── items_collected (INT)
├── items_taken (INT)
├── upgrades_used (JSON)
├── duration_seconds (INT)
├── won (BOOLEAN)
└── played_at (TIMESTAMP)
```

## 🔧 Переменные окружения

Скопируй `.env.example` и заполни:

```env
# MySQL Configuration
MYSQL_HOST=your-planetscale-host
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=ball_game_db
MYSQL_PORT=3306

# Server
PORT=3000
NODE_ENV=production
```

## 📝 Production URL

После деплоя на Vercel, используй URL вроде:
```
https://ball-game-backend-xxx.vercel.app
```

Обнови в фронтенде переменную `API_BASE_URL` на этот URL.

## ❌ Troubleshooting

### "ENOTFOUND" ошибка
- Проверь MYSQL_HOST в .env
- Убедись, что MySQL базе данных открыты правильные порты

### "Unknown database" ошибка
- Запусти `schema.sql` в своей базе данных
- Проверь имя БД в MYSQL_DATABASE

### Connection timeout
- Проверь, что host и credentials правильные
- Убедись, что MySQL сервер запущен и доступен

## 📦 Зависимости

- `express` - Web framework
- `mysql2` - MySQL драйвер
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
