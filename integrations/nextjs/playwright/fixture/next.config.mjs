import { fileURLToPath } from 'node:url'

export default {
  // The fixture consumes the built workspace package outside this directory.
  outputFileTracingRoot: fileURLToPath(new URL('../../../../..', import.meta.url)),
}
