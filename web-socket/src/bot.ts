import { Telegraf } from 'telegraf';
import { Config } from './config';
import { log } from './utils/log';

const { tmBotToken } = Config;
export const bot = tmBotToken ? new Telegraf(tmBotToken) : undefined;

if (bot) {
  log.normal('Telegram', `Starting...`);

  bot
    .launch()
    .then(() => log.success('Telegram', `Started with ${tmBotToken}`))
    .catch(e => log.error('Telegram', e));
}
