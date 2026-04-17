// Minimal ESM shim for the 'debug' package (CJS-only) to support Nuxt SSR builds

function createDebug() {
  const noop = () => {}
  noop.enabled = false
  noop.log = noop
  noop.extend = () => createDebug()
  noop.destroy = () => true
  noop.namespace = ''
  return noop
}

const debug = (namespace) => {
  const fn = createDebug()
  fn.namespace = namespace
  return fn
}

debug.enable = () => {}
debug.disable = () => ''
debug.enabled = () => false
debug.names = []
debug.skips = []
debug.formatters = {}

export default debug
