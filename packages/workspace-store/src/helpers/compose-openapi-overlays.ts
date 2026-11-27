import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { getOwnEntry } from '@scalar/helpers/object/get-own-entry'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { preventPollution } from '@scalar/helpers/object/prevent-pollution'
import type { JSONPathNode, JSONPathQuery, JSONValue } from 'json-p3'

import { type OverlayCompositionLimits, createOverlayCompositionBudget } from '@/helpers/overlay-composition-budget'
import { PLUGIN_DOCUMENT_TYPE_KEY } from '@/schemas/plugin-document'
import { isAsyncApiDocument, isOpenApiDocument } from '@/schemas/type-guards'

/** A parsed Overlay and its retrieval URI, if known. */
export type LoadedOverlay = { document: unknown; sourceUri?: string }

/** An action that succeeded without changing the description because no node matched. */
export type OverlayDiagnostic = { overlayIndex: number; actionIndex: number; target: string }

type Location = (string | number)[]
type JsonObject = Record<string, JSONValue>
type Action = Record<string, unknown> & { target: string }
type OverlayVersion = '1.0' | '1.1' | '1.2'
type Budget = ReturnType<typeof createOverlayCompositionBudget>

const URI_SCHEME = /^[a-z][a-z\d+.-]*:/i

const isAuthoredOpenApi = (document: Record<string, unknown>): boolean =>
  !isAsyncApiDocument(document) &&
  (isOpenApiDocument(document) ? /^3\.\d+\.\d+$/.test(document.openapi) : document.swagger === '2.0')

const optionalString = (object: Record<string, unknown>, key: string): string | undefined => {
  const value = getOwnEntry(object, key)
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`"${key}" must be a string`)
  }
  return value
}

const uriReference = (object: Record<string, unknown>, key: string, allowFragment = false): string | undefined => {
  const value = optionalString(object, key)
  if (
    value !== undefined &&
    (/[^A-Za-z0-9\-._~:/?[\]@!$&'()*+,;=%#]/.test(value) ||
      /%(?![\da-f]{2})/i.test(value) ||
      /#.*#/.test(value) ||
      (!allowFragment && value.includes('#')))
  ) {
    throw new Error(`"${key}" must be a URI reference${allowFragment ? '' : ' without a fragment'}`)
  }
  return value
}

const getIdentity = (uri: URL): string => {
  if (uri.protocol === 'file:') {
    // Local loaders decode escaped path segments. Compare equivalent spellings while
    // keeping encoded separators within their original segment.
    const segments = uri.pathname.split('/').map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    uri.pathname = segments.join('/').replace(/^\/([a-z])%3A(?=\/|$)/i, '/$1:')
  }
  return uri.href
}

const checkOverlayIdentity = (
  overlay: Record<string, unknown>,
  sourceUri: string | undefined,
  base: Record<string, unknown>,
  baseSourceUri: string | undefined,
  version: OverlayVersion,
): void => {
  const self = version === '1.2' ? uriReference(overlay, '$self') : undefined
  const extendsUri = uriReference(overlay, 'extends', version !== '1.2')
  const overlayIdentity =
    self !== undefined && (sourceUri || URI_SCHEME.test(self)) ? new URL(self, sourceUri).href : sourceUri
  if (extendsUri === undefined) {
    return
  }
  if (!overlayIdentity && !URI_SCHEME.test(extendsUri)) {
    throw new Error(
      `A relative "extends" requires an Overlay source URI${version === '1.2' ? ' or an absolute "$self"' : ''}`,
    )
  }

  // $self was introduced in OpenAPI 3.2. The retrieval URI identifies older descriptions.
  const baseSelf =
    typeof base.openapi === 'string' && /^3\.2\.\d+$/.test(base.openapi) && typeof base.$self === 'string'
      ? base.$self
      : undefined
  const baseUri = baseSelf === undefined ? baseSourceUri : new URL(baseSelf, baseSourceUri).href
  const targetIdentity = getIdentity(new URL(extendsUri, overlayIdentity))
  if (!baseUri || getIdentity(new URL(baseUri)) !== targetIdentity) {
    throw new Error(`"extends" resolves to "${targetIdentity}", which does not identify the base description`)
  }
}

const serializeUpdate = (value: unknown, budget: Budget): { json: string; size: number } =>
  budget.serialize(value, (key, item) => {
    // The result will also pass through the workspace's object and proxy helpers.
    if (key === '__proto__') {
      preventPollution(key, 'Overlay update')
    }
    if (
      item === null ||
      typeof item === 'string' ||
      typeof item === 'boolean' ||
      (typeof item === 'number' && Number.isFinite(item)) ||
      Array.isArray(item) ||
      isObject(item)
    ) {
      return
    }
    throw new Error('"update" must contain only JSON values')
  })

const compileSelector = (expression: string, field: 'target' | 'copy', budget: Budget): JSONPathQuery => {
  try {
    return budget.compile(expression)
  } catch (error) {
    throw new Error(`Invalid JSONPath in "${field}": ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    })
  }
}

const validateFields = (action: Record<string, unknown>, budget: Budget): void => {
  optionalString(action, 'description')
  if (Object.hasOwn(action, 'remove') && typeof action.remove !== 'boolean') {
    throw new Error('"remove" must be a boolean')
  }
  if (Object.hasOwn(action, 'copy')) {
    if (typeof action.copy !== 'string') {
      throw new Error('"copy" must be a valid JSONPath expression')
    }
    compileSelector(action.copy, 'copy', budget)
  }
  if (Object.hasOwn(action, 'update')) {
    serializeUpdate(action.update, budget)
  }
}

const getReusableActions = (overlay: Record<string, unknown>, budget: Budget): Map<string, Record<string, unknown>> => {
  const actions = new Map<string, Record<string, unknown>>()
  const { components } = overlay
  if (components === undefined) {
    return actions
  }
  if (!isObject(components) || (components.actions !== undefined && !isObject(components.actions))) {
    throw new Error('"components.actions" must be an object')
  }

  for (const [key, action] of Object.entries(components.actions ?? {})) {
    budget.reserveActions(1)
    if (!isObject(action)) {
      throw new Error(`Invalid reusable action "${key}"`)
    }
    optionalString(action, 'description')
    const fields = Object.hasOwn(action, 'fields') ? action.fields : {}
    if (!isObject(fields) || Object.hasOwn(fields, 'target') || Object.hasOwn(fields, '$ref')) {
      throw new Error(`Invalid fields for reusable action "${key}"`)
    }
    validateFields(fields, budget)
    actions.set(key, fields)
  }
  return actions
}

const getAction = (
  action: unknown,
  reusableActions: Map<string, Record<string, unknown>>,
  version: OverlayVersion,
  budget: Budget,
): Action => {
  if (!isObject(action) || typeof action.target !== 'string') {
    throw new Error('An action must specify a JSONPath "target"')
  }
  if (version === '1.0' && Object.hasOwn(action, 'copy')) {
    throw new Error('"copy" requires Overlay 1.1 or later')
  }
  if (version !== '1.2' && Object.hasOwn(action, '$ref')) {
    throw new Error('Reusable action references require Overlay 1.2')
  }
  validateFields(action, budget)

  if (!Object.hasOwn(action, '$ref')) {
    return { ...action, target: action.target }
  }
  if (typeof action.$ref !== 'string' || !action.$ref.startsWith('#')) {
    throw new Error('A reusable action reference must point to this Overlay')
  }

  const pointer = decodeURIComponent(action.$ref.slice(1))
  const [components, actions, key, ...rest] = parseJsonPointerSegments(pointer)
  if (
    !pointer.startsWith('/') ||
    /~(?![01])/.test(pointer) ||
    components !== 'components' ||
    actions !== 'actions' ||
    key === undefined ||
    rest.length > 0
  ) {
    throw new Error('A reusable action reference must point to a key under "#/components/actions/"')
  }
  const fields = reusableActions.get(key)
  if (!fields) {
    throw new Error(`Reusable action "${key}" does not exist`)
  }
  return { ...fields, ...action, target: action.target }
}

const kindOf = (value: unknown): 'object' | 'array' | 'primitive' => {
  if (Array.isArray(value)) {
    return 'array'
  }
  return isObject(value) ? 'object' : 'primitive'
}

const mergeValue = (target: unknown, update: unknown, version: OverlayVersion, direct = false): unknown => {
  if (Array.isArray(target) && (direct || Array.isArray(update))) {
    // Overlay 1.0 appends one entry to a directly selected array and replaces array properties in object updates.
    if (version === '1.0' && !direct) {
      return update
    }
    // Overlay 1.1 and 1.2 concatenate array properties when merging objects.
    // https://spec.openapis.org/overlay/v1.2.0.html#action-object
    const values = version !== '1.0' && Array.isArray(update) ? update : [update]
    for (const value of values) {
      target.push(value)
    }
    return target
  }
  if (isObject(target) && isObject(update)) {
    for (const [key, value] of Object.entries(update)) {
      target[key] = Object.hasOwn(target, key) ? mergeValue(target[key], value, version) : value
    }
    return target
  }
  if (kindOf(target) === 'primitive' && kindOf(update) === 'primitive') {
    return update
  }
  throw new Error('The action value is incompatible with the selected node')
}

const getParent = (document: Record<string, unknown>, location: Location): object =>
  getValueAtPath<object>(document, location.slice(0, -1).map(String))

const lastIndex = (location: Location): number => {
  const key = location.at(-1)
  return typeof key === 'number' ? key : -1
}

const applyAction = (document: JsonObject, action: Action, version: OverlayVersion, budget: Budget): boolean => {
  // JSONPath can select the same location more than once. Apply a mutation once per location.
  const matches = new Map<string, JSONPathNode>()
  let matchCount = 0
  const target = compileSelector(action.target, 'target', budget)
  for (const node of target.findIter(budget.read(document, action.target))) {
    matchCount += 1
    budget.checkMatch(matchCount, node.location)
    matches.set(node.normalizedPath(), node)
  }
  if (matches.size === 0) {
    return false
  }

  // Visit nested locations before their parents and remove array indices in descending order
  // so every location still points to its original element.
  const ordered = [...matches.values()].sort(
    (a, b) =>
      b.location.length - a.location.length ||
      (action.remove === true ? lastIndex(b.location) - lastIndex(a.location) : 0),
  )

  if (version === '1.0' && ordered.some(({ value }) => kindOf(value) === 'primitive')) {
    throw new Error('Overlay 1.0 targets must select only objects or arrays')
  }

  if (action.remove === true) {
    for (const { location } of ordered) {
      const key = location.at(-1)
      if (key === undefined) {
        throw new Error('An Overlay cannot remove the root of an OpenAPI description')
      }
      const parent = getParent(document, location)
      if (Array.isArray(parent) && typeof key === 'number') {
        // Removing an element shifts everything to its right.
        budget.spendWork(parent.length - key)
        parent.splice(key, 1)
      } else {
        Reflect.deleteProperty(parent, key)
      }
    }
    return true
  }

  // Overlay 1.1 and 1.2 define update and copy as having no effect when both are present.
  const hasUpdate = Object.hasOwn(action, 'update')
  const hasCopy = typeof action.copy === 'string'
  if (hasUpdate === hasCopy) {
    return true
  }

  if (version !== '1.0' && new Set(ordered.map(({ value }) => kindOf(value))).size > 1) {
    throw new Error('Update and copy require all selected nodes to have the same kind')
  }

  let update = action.update
  if (typeof action.copy === 'string') {
    const copy = compileSelector(action.copy, 'copy', budget)
    let copied: JSONValue | undefined
    for (const node of copy.findIter(budget.read(document, action.copy))) {
      if (copied !== undefined) {
        throw new Error('"copy" must select exactly one node')
      }
      copied = budget.unwrap(node.value)
    }
    if (copied === undefined) {
      throw new Error('"copy" must select exactly one node')
    }
    update = copied
  }

  // Snapshot the value before mutating any target, including when it contains the copy source.
  const { json, size } = serializeUpdate(update, budget)
  budget.reserveSize(size * ordered.length)
  for (const { location, value } of ordered) {
    const original = budget.unwrap(value)
    const updated = mergeValue(original, JSON.parse(json), version, true)
    const key = location.at(-1)
    if (key !== undefined && updated !== original) {
      Reflect.set(getParent(document, location), key, updated)
    }
  }

  return true
}

const getOverlayVersion = (value: unknown): OverlayVersion => {
  const version = typeof value === 'string' ? /^(1\.[012])\.(0|[1-9]\d*)$/.exec(value)?.[1] : undefined
  if (version === '1.0' || version === '1.1' || version === '1.2') {
    return version
  }
  throw new Error('Expected an Overlay with version 1.0.x, 1.1.x, or 1.2.x')
}

/** Applies already-loaded Overlays to a fresh copy of an authored OpenAPI description. */
export const composeOpenApiOverlays = (
  base: Record<string, unknown>,
  overlays: readonly LoadedOverlay[],
  baseSourceUri?: string,
  limits?: Partial<OverlayCompositionLimits>,
): { document: Record<string, unknown>; diagnostics: OverlayDiagnostic[] } => {
  const budget = createOverlayCompositionBudget(limits)
  // JSON has independent nodes at each location, even when the source used YAML aliases.
  const { json, size } = budget.serialize(base)
  budget.reserveSize(size)
  const document: JsonObject = JSON.parse(json)
  delete document[PLUGIN_DOCUMENT_TYPE_KEY]
  if (!isAuthoredOpenApi(document)) {
    throw new Error('Overlays require an OpenAPI description')
  }

  const diagnostics: OverlayDiagnostic[] = []
  for (const [overlayIndex, { document: overlay, sourceUri }] of overlays.entries()) {
    const context = `Overlay ${overlayIndex + 1}${sourceUri ? ` (${sourceUri})` : ''}`
    try {
      if (!isObject(overlay)) {
        throw new Error('An Overlay must be an object')
      }
      const version = getOverlayVersion(overlay.overlay)
      if (version !== '1.2' && Object.hasOwn(overlay, '$self')) {
        throw new Error('"$self" requires Overlay 1.2')
      }
      if (version !== '1.2' && Object.hasOwn(overlay, 'components')) {
        throw new Error('Reusable action components require Overlay 1.2')
      }
      if (
        !isObject(overlay.info) ||
        typeof overlay.info.title !== 'string' ||
        typeof overlay.info.version !== 'string'
      ) {
        throw new Error('Overlay "info" must include string "title" and "version" fields')
      }
      optionalString(overlay.info, 'description')
      if (!Array.isArray(overlay.actions) || overlay.actions.length === 0) {
        throw new Error('An Overlay must contain at least one action')
      }
      budget.reserveActions(overlay.actions.length)
      checkOverlayIdentity(overlay, sourceUri, base, baseSourceUri, version)
      const reusableActions = getReusableActions(overlay, budget)
      for (const [actionIndex, entry] of overlay.actions.entries()) {
        try {
          const action = getAction(entry, reusableActions, version, budget)
          if (!applyAction(document, action, version, budget)) {
            diagnostics.push({ overlayIndex, actionIndex, target: action.target })
          }
        } catch (error) {
          throw new Error(`Action ${actionIndex + 1}: ${error instanceof Error ? error.message : String(error)}`, {
            cause: error,
          })
        }
      }
    } catch (error) {
      throw new Error(`${context}: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
  }

  delete document[PLUGIN_DOCUMENT_TYPE_KEY]
  if (!isAuthoredOpenApi(document)) {
    throw new Error('Overlay composition must produce an OpenAPI description')
  }
  return { document, diagnostics }
}
