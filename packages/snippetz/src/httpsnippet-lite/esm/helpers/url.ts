// @ts-nocheck
export function toSearchParams(obj) {
  return new URLSearchParams(
    Object.entries(obj)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((v) => [key, v])
        }
        return [[key, value]]
      }),
  )
}
export class ExtendedURL extends URL {
  get path() {
    return this.pathname + this.search
  }
}
