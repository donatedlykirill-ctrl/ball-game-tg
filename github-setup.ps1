#!/usr/bin/env powershell
# Ball Game - Git Setup Script
# Автоматическая загрузка проекта на GitHub

Write-Host "🚀 Ball Game GitHub Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Проверка git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git не установлен! Загрузи с https://git-scm.com" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git найден" -ForegroundColor Green

# Проверка текущей директории
$currentDir = Get-Location
Write-Host "📁 Текущая папка: $currentDir" -ForegroundColor Yellow

# Запрос USERNAME
Write-Host ""
$username = Read-Host "👤 Введи свой GitHub Username"
$repoName = Read-Host "📦 Имя репозитория (по умолчанию: ball-game-tg)"

if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "ball-game-tg"
}

$remoteUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "Будет использован URL:" -ForegroundColor Cyan
Write-Host $remoteUrl -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Продолжить? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Отменено" -ForegroundColor Red
    exit 0
}

# Git конфиг
Write-Host ""
Write-Host "⚙️ Настройка Git..." -ForegroundColor Cyan
git config --global user.name "Ball Game Developer"
git config --global user.email "noreply@ballgame.local"
Write-Host "✅ Git конфиг установлен" -ForegroundColor Green

# Удалить старый remote если есть
Write-Host ""
Write-Host "🔄 Очистка старого remote..." -ForegroundColor Cyan
git remote remove origin 2>$null
Write-Host "✅ Готово" -ForegroundColor Green

# Добавить новый remote
Write-Host ""
Write-Host "📌 Добавление нового remote..." -ForegroundColor Cyan
git remote add origin $remoteUrl
Write-Host "✅ Remote добавлен: $remoteUrl" -ForegroundColor Green

# Проверить статус
Write-Host ""
Write-Host "📊 Статус репозитория:" -ForegroundColor Cyan
git status

# Добавить все файлы
Write-Host ""
Write-Host "📝 Добавление всех файлов..." -ForegroundColor Cyan
git add .
Write-Host "✅ Файлы добавлены" -ForegroundColor Green

# Коммит
Write-Host ""
Write-Host "💾 Создание коммита..." -ForegroundColor Cyan
git commit -m "Initial commit - Ball Arena Game with MySQL Backend"
Write-Host "✅ Коммит создан" -ForegroundColor Green

# Переименовать ветку на main если нужно
Write-Host ""
Write-Host "🌳 Переименование ветки на main..." -ForegroundColor Cyan
git branch -M main
Write-Host "✅ Ветка переименована" -ForegroundColor Green

# Push
Write-Host ""
Write-Host "⬆️ Загрузка на GitHub..." -ForegroundColor Cyan
Write-Host "⚠️ Может потребоваться ввести пароль или Personal Access Token" -ForegroundColor Yellow
Write-Host ""
Write-Host "Если запросит пароль:" -ForegroundColor Yellow
Write-Host "  1. Открой https://github.com/settings/tokens" -ForegroundColor Yellow
Write-Host "  2. New token → repo scope → Generate" -ForegroundColor Yellow
Write-Host "  3. Скопируй токен и вставь как пароль" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ ВСЁ ГОТОВО!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Твой репозиторий:" -ForegroundColor Green
Write-Host "   https://github.com/$username/$repoName" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Следующие шаги:" -ForegroundColor Green
Write-Host "   1. Открой https://vercel.com" -ForegroundColor Yellow
Write-Host "   2. Sign Up с GitHub" -ForegroundColor Yellow
Write-Host "   3. Import Project" -ForegroundColor Yellow
Write-Host "   4. Выбери репозиторий '$repoName'" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Подробное руководство: DEPLOY_WEB.md" -ForegroundColor Cyan
Write-Host ""
