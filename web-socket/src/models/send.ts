import { WsEvent } from "@common/models";
import { MappablePayload } from "./mappable-payload";

export type Send = <E extends keyof WsEvent, P extends WsEvent<false>[E] | WsEvent[E]>
(event: E, payload: MappablePayload<P>) => void;
