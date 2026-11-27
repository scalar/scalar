export {
  type DynamicScope,
  collectDynamicAnchors,
  isDynamicRef,
  pushDynamicScope,
  resolveDynamicRef,
} from './dynamic-ref'
export { createDynamicRefResolver, createMagicProxy } from './proxy'
export { DYNAMIC_REF_VALUE, getRaw } from './symbols'
