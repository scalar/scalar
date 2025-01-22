import {
  type AnyObject,
  normalize,
  resolveReferences,
} from '../../../src/index.js'

export async function resolveNew(specification: AnyObject) {
  return resolveReferences(normalize(specification))
}
