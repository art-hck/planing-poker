import { Uuid } from '../../../common/models';
import { Broadcast } from '../models';
import { connections } from '../repository/connections.repository';
import { replacer } from './set-map-utils';

export const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid, targetUserId?: Uuid) => {
  connections.get(roomId)?.forEach((connections, userId) => {
    if (targetUserId && targetUserId !== userId) return;
    connections.forEach(connection => {
      const payload = typeof payloadOrFn === 'function' ? payloadOrFn(userId) : payloadOrFn;
      connection.send(JSON.stringify({ event, payload }, replacer));
    });
  });
};
