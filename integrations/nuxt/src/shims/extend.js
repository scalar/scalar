// Minimal ESM shim for the 'extend' package (CJS-only) to support Nuxt SSR builds

function deepExtend(target, source) {
  Object.keys(source || {}).forEach((key) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return
    }
    const val = source[key]
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      target[key] = deepExtend(target[key] || {}, val)
    } else {
      target[key] = val
    }
  })
  return target
}

export default function extend(deep, ...args) {
  // Real extend always mutates the target in place — never create a fresh copy.
  if (typeof deep !== 'boolean') {
    // Called as extend(target, ...sources): deep is actually the target.
    const target = deep != null && typeof deep === 'object' ? deep : {}
    return args.reduce((acc, src) => Object.assign(acc, src), target)
  }
  const [target, ...sources] = args
  const base = target != null && typeof target === 'object' ? target : {}
  if (!deep) {
    return sources.reduce((acc, src) => Object.assign(acc, src), base)
  }
  return sources.reduce((acc, src) => deepExtend(acc, src), base)
}
