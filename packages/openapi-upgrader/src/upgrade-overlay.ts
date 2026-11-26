import { isObject } from '@scalar/helpers/object/is-object'
import { type JSONPathQuery, compile } from 'json-p3'

/** A migration issue at a JSON Pointer in the input Overlay. */
export type OverlayUpgradeDiagnostic = {
  path: string
  message: string
}

/** A saveable Overlay 1.2 document or diagnostics explaining why migration stopped. */
export type OverlayUpgradeResult =
  | { ok: true; document: Record<string, unknown> }
  | { ok: false; diagnostics: OverlayUpgradeDiagnostic[] }

// A canonical JSONPath with only child segments made up of one name or index selector each.
const SINGULAR_PATH = /^\$(?:\[(?:-?\d+|'(?:[^'\\]|\\.)*')\])*$/u

const URI_REFERENCE = /^(?:([a-z][a-z\d+.-]*):)?(?:\/\/([^/?]*))?([^?]*)(?:\?(.*))?$/i
const AUTHORITY = /^(?:([^@]*)@)?(\[[^\]]+\]|[^:[\]@]*)(?::\d*)?$/
const INVALID_PATH_OR_QUERY_CHARACTER = /[^a-z\d._~!$&'()*+,;=:%@/?-]/i

const isUriReference = (value: string): boolean => {
  const match = URI_REFERENCE.exec(value)
  if (!match || /%(?![\da-f]{2})/i.test(value)) {
    return false
  }
  const [, scheme, authority, path = '', query = ''] = match
  if (INVALID_PATH_OR_QUERY_CHARACTER.test(path) || INVALID_PATH_OR_QUERY_CHARACTER.test(query)) {
    return false
  }
  if (authority === undefined) {
    return scheme !== undefined || !/^[^/]*:/.test(path)
  }
  const parts = AUTHORITY.exec(authority)
  if (!parts) {
    return false
  }
  const [, userInfo = '', host = ''] = parts
  if (!/^[a-z\d._~!$&'()*+,;=:%-]*$/i.test(userInfo)) {
    return false
  }
  if (host.startsWith('[')) {
    // WHATWG URLs can validate IPv6 literals. RFC 3986 also allows IPvFuture literals.
    return URL.canParse(`http://${host}`) || /^\[v[\da-f]+\.[a-z\d._~!$&'()*+,;=:-]+\]$/i.test(host)
  }
  return /^[a-z\d._~!$&'()*+,;=%-]*$/i.test(host)
}

const containsArray = (object: Record<string, unknown>): boolean =>
  Object.values(object).some((value) => Array.isArray(value) || (isObject(value) && containsArray(value)))

const migrateLegacyUpdate = (
  action: Record<string, unknown>,
  target: JSONPathQuery,
  path: string,
  diagnostics: OverlayUpgradeDiagnostic[],
): Record<string, unknown> => {
  const { update } = action
  if (action.remove === true || !Object.hasOwn(action, 'update')) {
    return action
  }
  if (Array.isArray(update)) {
    // An array payload in a valid Overlay 1.0 action can only update array targets.
    return { ...action, update: [update] }
  }
  if (isObject(update)) {
    if (!SINGULAR_PATH.test(target.canonicalPath())) {
      diagnostics.push({
        path,
        message: `"${action.target}" may match both arrays and objects. Inspect the target description and split the action into selectors for each kind.`,
      })
    }
    if (containsArray(update)) {
      diagnostics.push({
        path,
        message: `"${action.target}" has an array in an object update. Inspect the target description and use explicit remove and update actions where the array must be replaced.`,
      })
    }
  }
  return action
}

/**
 * Migrate a parsed Overlay to 1.2 without applying it to an API description.
 * Overlay 1.0 actions that depend on the target shape produce diagnostics.
 */
export const upgradeOverlay = (input: unknown): OverlayUpgradeResult => {
  if (!isObject(input) || typeof input.overlay !== 'string' || !/^1\.[012]\.(?:0|[1-9]\d*)$/.test(input.overlay)) {
    return {
      ok: false,
      diagnostics: [{ path: '/overlay', message: 'Expected Overlay version 1.0.x, 1.1.x, or 1.2.x.' }],
    }
  }

  const legacy = input.overlay.startsWith('1.0.')
  const modern = input.overlay.startsWith('1.2.')
  const diagnostics: OverlayUpgradeDiagnostic[] = []
  if (!isObject(input.info) || typeof input.info.title !== 'string' || typeof input.info.version !== 'string') {
    diagnostics.push({ path: '/info', message: 'Provide an Overlay title and version as strings.' })
  }
  for (const key of ['$self', 'extends'] as const) {
    if (!Object.hasOwn(input, key)) {
      continue
    }
    const value = input[key]
    if (key === '$self' && !modern) {
      diagnostics.push({ path: '/$self', message: 'Remove "$self" or confirm the intended Overlay base URI in 1.2.' })
    } else if (typeof value !== 'string' || value.includes('#') || !isUriReference(value)) {
      diagnostics.push({
        path: `/${key}`,
        message: `Set "${key}" to a valid URI reference without a fragment.`,
      })
    }
  }
  if (!modern && Object.hasOwn(input, 'components')) {
    diagnostics.push({ path: '/components', message: 'Review the reusable actions before migrating to Overlay 1.2.' })
  }
  if (!Array.isArray(input.actions) || input.actions.length === 0) {
    diagnostics.push({ path: '/actions', message: 'Provide at least one Overlay action.' })
    return { ok: false, diagnostics }
  }

  const actions = input.actions.map((action: unknown, index: number) => {
    const path = `/actions/${index}`
    if (!isObject(action) || typeof action.target !== 'string') {
      diagnostics.push({ path: `${path}/target`, message: 'Provide a JSONPath target for this action.' })
      return action
    }
    if (!modern && Object.hasOwn(action, '$ref')) {
      diagnostics.push({
        path: `${path}/$ref`,
        message: 'Review the reusable action reference before migrating to 1.2.',
      })
    }
    if (legacy && Object.hasOwn(action, 'copy')) {
      diagnostics.push({
        path: `${path}/copy`,
        message: 'Remove "copy" or confirm the intended action in Overlay 1.2.',
      })
    }
    if (!legacy) {
      return action
    }

    let target: JSONPathQuery
    try {
      target = compile(action.target)
    } catch {
      diagnostics.push({ path: `${path}/target`, message: 'Rewrite the target as an RFC 9535 JSONPath expression.' })
      return action
    }
    return migrateLegacyUpdate(action, target, `${path}/update`, diagnostics)
  })

  return diagnostics.length > 0
    ? { ok: false, diagnostics }
    : { ok: true, document: structuredClone({ ...input, overlay: modern ? input.overlay : '1.2.0', actions }) }
}
