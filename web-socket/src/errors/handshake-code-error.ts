export class HandshakeCodeError extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, HandshakeCodeError.prototype);
  }
}
