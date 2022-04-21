export class InvalidParamsError extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, InvalidParamsError.prototype);
  }
}
