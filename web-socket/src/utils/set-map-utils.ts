export function serialize<T = unknown>(object: T) {
  return JSON.parse(JSON.stringify(object, (k: any, v: any) => {
    return v instanceof Map ? { dataType: 'Map', value: [...v.entries()] } : v instanceof Set ? { dataType: 'Set', value: [...v], } : v;
  }));
}

export function deserialize<T = unknown>(object: T) {
  return JSON.parse(JSON.stringify(object), (k: any, v: any) => {
    return typeof v === 'object' && v !== null ? v.dataType === 'Map' ? new Map(v.value) : v.dataType === 'Set' ? new Set(v.value) : v : v;
  });
}
