/**
 * Deep merge for objects
 **/
export function deepMerge(source: Record<any, any>, target: Record<any, any>) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      target[key] ??= new val.__proto__.constructor()
      deepMerge(val, target[key])
    } else {
      target[key] = val
    }
  }

  return target
}
