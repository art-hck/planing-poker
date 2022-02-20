import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" })

export const Config = {
  dbUsername: process.env['MONGO_INITDB_ROOT_USERNAME'],
  dbPassword: process.env['MONGO_INITDB_ROOT_PASSWORD'],
  dbName: process.env['MONGO_INITDB_DATABASE'],
  dbHost: process.env['MONGO_HOST'],
  dbPort: process.env['MONGO_HOST'],
  wsPort: process.env['WS_PORT'] || 9000,
  jwtSecret: process.env['JWT_SECRET'] || 'JWT_SECRET',
  jwtRtSecret: process.env['JWT_RT_SECRET'] || 'JWT_RT_SECRET',
  jwtExp: process.env['JWT_EXP'],
  jwtRtExp: process.env['JWT_RT_EXP'],
  tmBotToken: process.env['TELEGRAM_BOT_TOKEN'],
  tmChatId: process.env['TELEGRAM_CHAT_ID'],
}
