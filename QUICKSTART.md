# ⚡ Быстрый старт

## Для локальной разработки

### 1. Frontend (port 5173)
```bash
cp .env.example .env
npm install
npm run dev
```

### 2. Backend (port 3000)
```bash
cd backend
cp .env.example .env
# Заполни .env с MySQL credentials
npm install
npm run dev
```

### 3. Создай БД
Запусти SQL:
```sql
-- В MySQL клиенте:
SOURCE backend/schema.sql;
```

---

## Для Production (Vercel + MySQL хостинг)

1. **MySQL**: Зарегистрируйся на PlanetScale.com
2. **Backend API**:
   ```bash
   cd backend
   npm install -g vercel
   vercel  # Follow prompts
   # Добавь MySQL variables в Vercel Settings
   ```
3. **Frontend**:
   ```bash
   echo "VITE_APP_API_URL=https://your-backend.vercel.app" > .env.production
   npm run build
   vercel --prod
   ```

---

## Полное руководство
Смотри [SETUP.md](./SETUP.md)
