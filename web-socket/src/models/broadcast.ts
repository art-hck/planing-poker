import { Uuid, WsEvent } from "@common/models";
import { MappablePayload } from "./mappable-payload";

export type Broadcast = <E extends keyof WsEvent, P extends WsEvent<false>[E] | WsEvent[E]>
(event: E, payloadOrFn: MappablePayload<P> | ((userId: Uuid) => MappablePayload<P>), roomId: Uuid) => void;
