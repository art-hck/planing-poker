import { Telegraf } from 'telegraf';
import { Config } from './config';
import { telegramRepo } from './mongo';
import { log } from './utils/log';

const { tmBotToken } = Config;
export const bot = tmBotToken ? new Telegraf(tmBotToken) : undefined;

if (bot) {
  log.normal('Telegram', `Starting...`);

  bot.start(ctx => {
    const c = code();
    switch (ctx.startPayload) {
      case 'register':
        telegramRepo.register(ctx.from.id, c).then(e => ctx.reply(e ? `*${c}*` : 'Аккаунт уже связан', { parse_mode: 'MarkdownV2' }));
        break;
      case 'handshake':
        telegramRepo.handshake(ctx.from.id, c)?.then(e => ctx.reply(e ? `*${c}*` : 'Аккаунт уже связан', { parse_mode: 'MarkdownV2' }));
        break;
    }
  });

  bot
    .launch()
    .then(() => log.success('Telegram', `Started with ${tmBotToken}`))
    .catch(e => log.error('Telegram', e));
}

function code() {
  return Math.floor(Math.random() * (9999 - 1000)) + 1000;
}
