export const log = {
  error: (name: string, ...data: any[]) => console.log(`${date()}`, `${`[${name}]`.padEnd(12)}\x1b[31m`, ...data, `\x1b[0m`),
  success: (name: string, ...data: any[]) => console.log(`${date()}`, `${`[${name}]`.padEnd(12)}\x1b[32m`, ...data, `\x1b[0m`),
  warning: (name: string, ...data: any[]) => console.log(`${date()}`, `${`[${name}]`.padEnd(12)}\x1b[33m`, ...data, `\x1b[0m`),
  blue: (name: string, ...data: any[]) => console.log(`${date()}`, `${`[${name}]`.padEnd(12)}\x1b[34m`, ...data, `\x1b[0m`),
  magenta: (name: string, ...data: any[]) => console.log(`${date()}`, `${`[${name}]`.padEnd(12)}\x1b[35m`, ...data, `\x1b[0m`),
  cyan: (name: string, ...data: any[]) => console.log(`${date()}`, `${`[${name}]`.padEnd(12)}\x1b[36m`, ...data, `\x1b[0m`),
  normal: (name: string, ...data: any[]) => console.log(date(), `${`[${name}]`.padEnd(12)}`, ...data)
};

function date() {
  return new Date().toISOString().slice(0, -5).replace('T', ' ');
}
