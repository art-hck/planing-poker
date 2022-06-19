import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const Config = {
  mongo: {
    host: process.env['MONGO_HOST'],
    port: process.env['MONGO_PORT'],
    dbName: process.env['MONGO_INITDB_DATABASE'],
    username: process.env['MONGO_INITDB_ROOT_USERNAME'],
    password: process.env['MONGO_INITDB_ROOT_PASSWORD'],
  },
  ws: {
    port: process.env['WS_PORT'] || 9000,
    cert: process.env['WS_CERT'],
    key: process.env['WS_KEY'],
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || 'JWT_SECRET',
    exp: process.env['JWT_EXP'],
    rt: {
      secret: process.env['JWT_RT_SECRET'] || 'JWT_RT_SECRET',
      exp: process.env['JWT_RT_EXP'],
    }
  },
  telegram: {
    token: process.env['TELEGRAM_BOT_TOKEN'],
    chatId: process.env['TELEGRAM_CHAT_ID'],
  },
  google: {
    clientId: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  },
  limits: {
    maxRooms: process.env['LIMITS_MAX_ROOMS'],
    maxVotings: process.env['LIMITS_MAX_VOTINGS'],
  },
  mail: {
    host: process.env['MAIL_HOST'],
    from: process.env['MAIL_FROM']
  }
};
