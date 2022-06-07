export class RoomAccessError extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, RoomAccessError.prototype);
  }
}
