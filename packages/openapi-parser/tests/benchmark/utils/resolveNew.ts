import {
  type AnyObject,
  normalize,
  resolveReferences,
} from '../../../src/index.ts'

export async function resolveNew(specification: AnyObject) {
  return resolveReferences(normalize(specification))
}
