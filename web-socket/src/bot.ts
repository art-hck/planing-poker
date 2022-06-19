import { Telegraf } from 'telegraf';
import { Config } from './config';
import { log } from './utils/log';

const { token } = Config.telegram;
export const bot = token ? new Telegraf(token) : undefined;

if (bot) {
  log.normal('Telegram', `Starting...`);

  bot
    .launch()
    .then(() => log.success('Telegram', `Started with ${token}`))
    .catch(e => log.error('Telegram', e));
}
