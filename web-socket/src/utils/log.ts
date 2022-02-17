export const log = {
  error: (...data: any[]) => console.log(date(), '\x1b[31m', ...data, '\x1b[0m'),
  success: (...data: any[]) => console.log(date(), `\x1b[32m`, ...data, `\x1b[0m`),
  normal: (...data: any[]) => console.log(date(), ...data),
}

function date() {
  return new Date().toISOString().slice(0, -5).replace("T", " ")
}
