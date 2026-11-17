# Telegram Snake Bot

Telegram-бот с мини-игрой «Змейка».

## Файлы
- `bot.py` — Telegram-бот на Python.
- `webapp/index.html` — игра для Telegram Mini App.
- `requirements.txt` — зависимости.

## 1. Создай бота
1. Открой Telegram и найди официального @BotFather.
2. Отправь `/newbot`, задай имя и username.
3. Сохрани токен в секрете. Не публикуй его в GitHub.

## 2. Опубликуй игру
Нужен публичный HTTPS-адрес файла `webapp/index.html`. Можно использовать GitHub Pages или другой статический хостинг. Для GitHub Pages настрой Settings → Pages и выбери источник публикации, который включает папку `snake-bot/webapp`. Если Pages не позволяет выбрать эту папку напрямую, скопируй содержимое webapp в корень отдельной ветки/репозитория либо используй статический хостинг.

## 3. Запусти бота
Нужен Python 3.10+.

```bash
cd snake-bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export BOT_TOKEN="токен_от_BotFather"
export WEBAPP_URL="https://адрес-твоей-игры/"
python bot.py
```

В Windows PowerShell вместо export используй:
```powershell
$env:BOT_TOKEN="токен_от_BotFather"
$env:WEBAPP_URL="https://адрес-твоей-игры/"
python bot.py
```

Оставь процесс запущенным или разверни его на VPS/облачном хостинге, чтобы бот работал постоянно.

## Важно
- Не добавляй настоящий токен в файлы репозитория.
- Если токен случайно опубликован, отзови его через BotFather и создай новый.
- Рекорд сейчас хранится локально в браузере каждого игрока, общего рейтинга пока нет.
