export const log = {
  error: (...data) => console.log(date(), ...data.map(d => `\x1b[31m${d}\x1b[0m`)),
  success: (...data) => console.log(date(), ...data.map(d => `\x1b[32m${d}\x1b[0m`)),
  normal: (...data) => console.log(date(), ...data),
}

function date() {
  return new Date().toISOString().slice(0, -5).replace("T", " ")
}
