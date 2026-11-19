import { resolveReferencePath } from '@scalar/json-magic/bundle'

/** Resolve only whole native files. Unknown inline locations never borrow a browser or process base. */
export const schemaResourcePath = (origin: string, reference: string): string => {
  if (!reference || reference.includes('#') || /[\u0000-\u0020]/.test(reference))
    throw new Error('Invalid dependency path')
  if ((!origin || origin === '/') && !/^(?:https?:\/\/|\/)/i.test(reference)) throw new Error('Unknown schema location')
  return resolveReferencePath(origin || '/', reference)
}
