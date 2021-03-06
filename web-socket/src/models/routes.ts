import { WsAction } from '../../../common/models';
import { RoutePayload } from './route-payload';

export type Routes = {
  [P in keyof WsAction]: (payload: RoutePayload<P>) => void | Promise<unknown>;
};
