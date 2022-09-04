export function isAsyncFunction(fn: any) {
  return fn[Symbol.toStringTag] === 'AsyncFunction'
}
