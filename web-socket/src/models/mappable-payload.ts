export type MappablePayload<V> = V extends [any, any][] ? Map<V[number][0], V[number][1]> | V : never | V;
