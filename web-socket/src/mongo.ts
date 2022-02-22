import { Collection, MongoClient, MongoServerSelectionError } from 'mongodb';
import { Config } from './config';
import { RefreshTokenRepository } from './repository/refresh-token.repository';
import { RoomRepository } from './repository/room.repository';
import { UserRepository } from './repository/user.repository';
import { VotingRepository } from './repository/voting.repository';
import { log } from './utils/log';

export const refreshTokenRepo = new RefreshTokenRepository();
export const roomRepo = new RoomRepository();
export const votingRepo = new VotingRepository();
export const usersRepo = new UserRepository();

const repoDeclaration = [refreshTokenRepo, roomRepo, votingRepo, usersRepo];
const { dbName, dbPassword, dbUsername, dbHost, dbPort } = Config;
const mongo = new MongoClient(`mongodb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}`);

log.normal('MongoDB', 'Connecting...');
const c = mongo.connect();
c.then(() => {
  log.success('MongoDB', `Started at ${dbPort} port`);
  const db = mongo.db(dbName);
  repoDeclaration.forEach(instance => instance.init(db.collection(instance.repositoryName) as Collection<any>));
  mongo.on('serverHeartbeatFailed', () => log.cyan('MongoDB', 'ServerHeartbeatFailed. Сервис продолжит работать но данные не будут записаны в базу.'));
}).catch(e => {
  if (e instanceof MongoServerSelectionError) {
    log.cyan('MongoDB', 'MongoServerSelectionError. Сервис продолжит работать но данные не будут записаны в базу.');
  } else {
    log.error('MongoDB', e);
  }
});
