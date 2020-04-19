/* eslint-disable no-unused-vars */
export function baseWarn (msg: string, range?: Range) {
  console.error(`[Vue compiler]: ${msg}`)
}

export function pluckModuleFunction<F> (
  modules: any,
  key: string
): Array<F> {
  return modules
    ? (<any[]>modules).map(m => m[key]).filter(_ => _)
    : []
}