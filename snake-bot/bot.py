import logging
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv('BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL')

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = ('Привет! Я бот со встроенной игрой «Змейка». Собирай яблоки, '
            'расти и постарайся не врезаться в стену или собственный хвост.')
    if not WEBAPP_URL:
        await update.message.reply_text(text + '\n\nИгра пока не опубликована. Владелец бота должен настроить WEBAPP_URL.')
        return
    keyboard = [[InlineKeyboardButton('Играть в змейку', web_app=WebAppInfo(url=WEBAPP_URL))]]
    await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text('Управление: стрелки на клавиатуре или экранные кнопки. Собирай яблоки, избегай стен и собственного хвоста.')

def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError('Не задан BOT_TOKEN. Получи токен у @BotFather и добавь его в переменные окружения.')
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler('start', start))
    app.add_handler(CommandHandler('help', help_command))
    logger.info('Бот запущен')
    app.run_polling()

if __name__ == '__main__':
    main()
