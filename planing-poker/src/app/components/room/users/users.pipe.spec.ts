import { UsersPipe } from './users.pipe';

describe('UsersPipe', () => {
  it('create an instance', () => {
    const pipe = new UsersPipe();
    expect(pipe).toBeTruthy();
  });
});
