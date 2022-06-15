import { UserLimits } from '../../../common/models';

export class LimitsError extends Error {
  limits: Partial<UserLimits>;
  constructor(limits: Partial<UserLimits>) {
    super("Limits error " + JSON.stringify(limits));
    this.limits = limits;

    Object.setPrototypeOf(this, LimitsError.prototype);
  }
}
