import { RoomUsersPipe } from './room-users.pipe';

describe('UsersPipe', () => {
  it('create an instance', () => {
    const pipe = new RoomUsersPipe();
    expect(pipe).toBeTruthy();
  });
});
