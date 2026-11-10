import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { decodeUriFragment } from '@scalar/json-magic/bundle'

type Binding = {
  field: readonly string[]
  reference: string
  target: readonly string[]
}
type Bindings = { byField: Map<string, Binding>; byFile: Map<string, Set<Binding>> }
const documents = new WeakMap<object, Bindings>()

const fileKey = (path: readonly string[]): string | undefined => (path[0] === 'x-ext' ? path[1] : undefined)
const filesFor = (binding: Binding): Set<string> =>
  new Set([fileKey(binding.field), fileKey(binding.target)].filter((key) => key !== undefined))

const removeBinding = (bindings: Bindings, binding: Binding): void => {
  bindings.byField.delete(JSON.stringify(binding.field))
  for (const file of filesFor(binding)) {
    const bucket = bindings.byFile.get(file)
    bucket?.delete(binding)
    if (bucket?.size === 0) {
      bindings.byFile.delete(file)
    }
  }
}

const setBinding = (bindings: Bindings, binding: Binding): void => {
  const key = JSON.stringify(binding.field)
  const previous = bindings.byField.get(key)
  if (previous) {
    removeBinding(bindings, previous)
  }
  bindings.byField.set(key, binding)
  for (const file of filesFor(binding)) {
    const bucket = bindings.byFile.get(file) ?? new Set<Binding>()
    bucket.add(binding)
    bindings.byFile.set(file, bucket)
  }
}

/** Remember a reference field the bundler processed, including edges from earlier lazy calls. */
export const trackExternalReference = (root: object, field: readonly string[], reference: string): void => {
  const [, fragment = ''] = reference.split('#', 2)
  if (!fragment.startsWith('/x-ext/')) {
    return
  }
  const bindings = documents.get(root) ?? { byField: new Map(), byFile: new Map() }
  const target = decodeUriFragment(fragment).slice(1).split('/').map(unescapeJsonPointerSegment)
  setBinding(bindings, { field, reference, target })
  documents.set(root, bindings)
}

/** Update previously emitted pointers in the files affected by a fragment relocation. */
export const retargetExternalReferences = (
  root: object,
  files: readonly string[],
  remap: (path: readonly string[]) => readonly string[],
): void => {
  const bindings = documents.get(root)
  if (!bindings) {
    return
  }
  const affected = new Set(files.flatMap((file) => [...(bindings.byFile.get(file) ?? [])]))
  for (const binding of affected) {
    const { field, reference, target } = binding
    const currentField = remap(field)
    const owner = getValueAtPath(root, currentField.slice(0, -1))
    removeBinding(bindings, binding)
    if (!isObject(owner) || owner.$ref !== reference) {
      continue
    }
    const currentTarget = remap(target)
    const uri = reference.split('#', 1)[0]
    const updatedReference =
      currentTarget === target
        ? reference
        : `${uri}#/${currentTarget.map((key) => encodeURIComponent(escapeJsonPointer(key))).join('/')}`
    if (updatedReference !== reference) {
      owner.$ref = updatedReference
    }
    setBinding(bindings, { field: currentField, reference: updatedReference, target: currentTarget })
  }
}
