// biome-ignore lint/performance/noBarrelFile: <explanation>

/** @deprecated Please import from @scalar/openapi-upgrader/2.0-to-3.0 instead */
export { upgradeFromTwoToThree } from '@scalar/openapi-upgrader/2.0-to-3.0'
/** @deprecated Please import from @scalar/openapi-upgrader/3.0-to-3.1 instead */
export { upgradeFromThreeToThreeOne } from '@scalar/openapi-upgrader/3.0-to-3.1'

export type { AnyObject, ErrorObject, Filesystem, LoadResult } from './types'
export { dereference } from './utils/dereference'
export { escapeJsonPointer } from './utils/escape-json-pointer'
export { filter } from './utils/filter'
export { isJson } from './utils/is-json'
export { isYaml } from './utils/is-yaml'
export { join } from './utils/join'
export { load } from './utils/load'
export { normalize } from './utils/normalize'
export { openapi } from './utils/openapi/openapi'
export { toJson } from './utils/to-json'
export { toYaml } from './utils/to-yaml'
export { sanitize } from './utils/transform/sanitize'
export { traverse } from './utils/traverse'
export { unescapeJsonPointer } from './utils/unescape-json-pointer'
export { upgrade } from './utils/upgrade'
export { validate } from './utils/validate'
