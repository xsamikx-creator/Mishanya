import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';

const token = process.env.BOT_TOKEN;
const appUrl = process.env.MINI_APP_URL || 'https://xsamikx-creator.github.io/Mishanya/';

if (!token) {
  throw new Error('Не найден BOT_TOKEN. Добавьте токен бота в переменные окружения.');
}

const bot = new Telegraf(token);

const launchKeyboard = Markup.inlineKeyboard([
  Markup.button.webApp('🍻 Открыть выживание Мишани', appUrl)
]);

bot.start(async ctx => {
  await ctx.reply(
    '🍻 Добро пожаловать в главное управление отпуском Мишани!\n\n' +
    'Здесь считаются пиво, кальяны, шашлыки, поездки на море и общий уровень легендарности.\n\n' +
    'Нажимай кнопку ниже 👇',
    launchKeyboard
  );
});

bot.command('открыть', async ctx => {
  await ctx.reply('Запускаем выживание Мишани 👇', launchKeyboard);
});

bot.command('помощь', async ctx => {
  await ctx.reply(
    'Команды:\n' +
    '/start — главное меню\n' +
    '/открыть — открыть мини-приложение\n' +
    '/помощь — показать подсказку'
  );
});

bot.catch((error, ctx) => {
  console.error(`Ошибка при обработке сообщения ${ctx.update.update_id}:`, error);
});

bot.launch();
console.log('Бот запущен');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
