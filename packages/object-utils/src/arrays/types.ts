/** Get the keys of an object. NOTE: This assumes no additional properties at runtime */
export function keysOf<T extends object>(obj: T) {
  return obj ? (Object.keys(obj).map((k) => String(k)) as (keyof T & string)[]) : []
}

/** Type guard for not null */
export function nonNullable<T>(val: T): val is NonNullable<T> {
  return val !== null
}
