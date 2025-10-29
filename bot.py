import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

BOT_TOKEN = "8444779391:AAFiioQJK2ZgR7-XcqqDpnMYzHbyiJ8Agz8"
bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def start_command(message):
    markup = InlineKeyboardMarkup()
    web_app = WebAppInfo(url="https://ng-vladimir.github.io/INLIFE/")
    button = InlineKeyboardButton("🚀 Открыть INLIFE App", web_app=web_app)
    markup.add(button)
    
    bot.send_message(
        message.chat.id,
        "🌟 Добро пожаловать в INLIFE!\n\nНажми кнопку ниже чтобы открыть наше приложение:",
        reply_markup=markup
    )

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.send_message(message.chat.id, "Отправь /start чтобы открыть приложение INLIFE")

if __name__ == "__main__":
    print("🤖 INLIFE Bot запущен!")
    print("📍 Бот готов открывать Mini App!")
    bot.polling(none_stop=True)