import { Telegraf } from 'telegraf';
import { Config } from './config';

const { tmBotToken } = Config;
export const bot = tmBotToken ? new Telegraf(tmBotToken) : undefined;
