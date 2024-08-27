import { type AnyObject, normalize, resolveReferences } from '../../../src'

export async function resolveNew(specification: AnyObject) {
  return resolveReferences(normalize(specification))
}
