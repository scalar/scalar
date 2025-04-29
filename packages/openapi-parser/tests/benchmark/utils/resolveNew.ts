import { type AnyObject, normalize, resolveReferences } from '../../../src/index'

export async function resolveNew(specification: AnyObject) {
  return resolveReferences(normalize(specification))
}
