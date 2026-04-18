# 🖥️ Деплой на Vercel через Веб-интерфейс

## Способ 1: Деплой Backend через GitHub

### Шаг 1: Загрузи проект на GitHub

1. Создай аккаунт на https://github.com
2. Создай новый репозиторий:
   - Имя: `ball-game` (или любое)
   - Description: Ball Game TG
   - Public (делай публичным)
   - ✅ Add .gitignore → Node
   - ✅ Add README

3. **Загрузи свой код:**

На Windows (PowerShell):
```powershell
cd "C:\Users\Пользователь\Desktop\home\BALL GAME TG"

# Инициализируй git
git init
git add .
git commit -m "Initial commit - Ball Game with backend"
git branch -M main

# Добавь удаленный репозиторий (замени USERNAME на твой GitHub username)
git remote add origin https://github.com/USERNAME/ball-game.git
git push -u origin main
```

### Шаг 2: Деплой Backend на Vercel через веб-сайт

1. Открой https://vercel.com
2. **Sign Up** (регистрация) → выбери "Continue with GitHub"
3. Авторизуйся в GitHub
4. Нажми **Import Project**
5. Выбери **Import Git Repository**
6. Вставь: `https://github.com/USERNAME/ball-game.git`
7. Нажми **Continue**

### Шаг 3: Конфигурация проекта Backend

На странице Import Project:

1. **Framework Preset** → Node.js
2. **Root Directory** → Нажми **Edit** → выбери `backend` → **Save**
3. **Build Command** → оставь пустым (или удали если есть)
4. **Environment Variables** → Добавь:
   ```
   MYSQL_HOST = 127.0.0.1
   MYSQL_USER = aruvaworkg
   MYSQL_PASSWORD = jCc-Urj-Sba-G3i
   MYSQL_DATABASE = aruvaworkg
   MYSQL_PORT = 3308
   NODE_ENV = production
   PORT = 3000
   ```

5. Нажми **Deploy**

**Ждешь ~2-3 минуты...**

✅ **Готово!** Получишь URL типа:
```
https://ball-game-backend-xxx.vercel.app
```

---

## Способ 2: Деплой Frontend на Vercel

### Шаг 1: Деплой фронтенда

1. На Vercel Dashboard нажми **Add New...** → **Project**
2. **Import Git Repository**
3. Выбери тот же репозиторий `ball-game`
4. Нажми **Continue**

### Шаг 2: Конфигурация Frontend

1. **Framework Preset** → Vite
2. **Root Directory** → . (точка - корень)
3. **Build Command** → `npm run build` (должно быть автоматически)
4. **Output Directory** → `dist`
5. **Environment Variables** → Добавь:
   ```
   VITE_APP_API_URL = https://ball-game-backend-xxx.vercel.app
   ```
   (Замени `xxx` на реальный ID!)

6. Нажми **Deploy**

✅ **Frontend готов!**
```
https://ball-game-frontend-xxx.vercel.app
```

---

## 🔄 Как обновлять код после этого

**Просто толкай в GitHub:**
```powershell
# Сделай изменения в коде
git add .
git commit -m "Обновление фич"
git push
```

Vercel **автоматически перестроит** оба проекта! ✨

---

## ✅ Проверка работы

1. Открой frontend URL
2. Сыграй раунд
3. Данные должны сохраниться в БД

Если не находится БД:
- Проверь переменные в Vercel → Settings → Environment Variables
- Может быть MySQL хост не доступен (нужен IP whitelist)

---

## 📋 Итого: 3 шага

| Шаг | Что делать | Время |
|-----|-----------|-------|
| 1️⃣ | GitHub → загрузи код | 5 мин |
| 2️⃣ | Vercel → деплой backend | 3 мин |
| 3️⃣ | Vercel → деплой frontend | 3 мин |

**Всего: 11 минут! ⚡**

---

## 🚨 Если ошибка при деплое

### "Build failed"
1. Посмотри Deployment Log в Vercel
2. Проверь `package.json` в backend и корне
3. Убедись что есть `npm run build` или `npm start`

### "Cannot find module"
1. Убедись что `node_modules` НЕ в git:
   ```
   echo "node_modules/" >> .gitignore
   ```
2. Перезагрузи: `git push`

### "ENOENT: no such file or directory"
- Проверь пути в backend.vercel.json (если существует)
- Убедись что package.json на месте

---

## 💡 Рекомендация

✅ Используй **GitHub + Vercel** - это самый удобный способ!
- Автоматический редеплой при `git push`
- Версионирование кода
- История изменений

**Ссылки:**
- Vercel: https://vercel.com
- GitHub: https://github.com
