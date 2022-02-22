export class DeniedError extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, DeniedError.prototype);
  }
}
