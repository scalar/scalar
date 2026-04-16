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
  if (typeof deep !== 'boolean') {
    return args.reduce((acc, src) => Object.assign(acc, src), Object.assign({}, deep))
  }
  const [target, ...sources] = args
  const base = Object.assign({}, target)
  if (!deep) {
    return sources.reduce((acc, src) => Object.assign(acc, src), base)
  }
  return sources.reduce((acc, src) => deepExtend(acc, src), base)
}
