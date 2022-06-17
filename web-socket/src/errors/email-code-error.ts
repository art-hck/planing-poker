export class EmailCodeError extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, EmailCodeError.prototype);
  }
}
