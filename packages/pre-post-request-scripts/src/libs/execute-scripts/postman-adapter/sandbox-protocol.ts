import type { VariableEntry } from '@scalar/workspace-store/request-example'

import type { ConsoleContext } from '../context/console'
import type { TestResult } from '../execute-post-response-script'

/**
 * Message channel shared between the host (main app realm) and the sandbox iframe.
 *
 * Pre/post-request scripts are executed by `postman-sandbox`, which relies on `eval`/`new Function`.
 * To keep `'unsafe-eval'` out of the main application CSP, that execution is relocated into an
 * iframe loaded from a real, same-origin `.html` file that carries its own (permissive) CSP. The
 * host and the iframe talk over `postMessage` using the messages defined here. Everything that
 * crosses the boundary must be structured-cloneable, so postman-collection objects are serialized
 * to their plain JSON form (`VariableScope`/`Request` definitions) and rebuilt inside the iframe.
 */
export const SANDBOX_CHANNEL = 'scalar-pre-post-request-scripts-sandbox'

/** Plain, serializable representation of a postman-collection `Request` (`Request.prototype.toJSON()`). */
export type PostmanRequestDefinition = unknown

/** Plain response shape consumed by `pm.response` inside the sandbox. */
export type PostmanResponseDefinition = {
  code: number
  status: string
  header: { key: string; value: string }[]
  stream: { type: 'Buffer'; data: number[] }
}

/** Variable scopes serialized as key/value arrays so the iframe can rebuild postman `VariableScope`s. */
export type SerializableScopes = {
  environment: VariableEntry[]
  globals: VariableEntry[]
  collectionVariables: VariableEntry[]
  data: Record<string, string>
  local: VariableEntry[]
}

/** Plain variable values as returned on a postman `ExecutionResult` scope (`{ values }`). */
export type SerializableVariableValues = Array<{ key: string; value: string; type?: string }>

/** Host → iframe: run a single pre-request or post-response script. */
export type SandboxExecuteRequest = {
  channel: typeof SANDBOX_CHANNEL
  kind: 'execute'
  id: string
  /** Maps to the postman-sandbox listener: `'prerequest'` for pre-request, `'test'` for post-response. */
  listen: 'prerequest' | 'test'
  script: string
  scopes?: SerializableScopes
  request?: PostmanRequestDefinition
  response?: PostmanResponseDefinition
}

/** iframe → host: the sandbox bridge has loaded and is ready to receive `execute` requests. */
export type SandboxReadyMessage = {
  channel: typeof SANDBOX_CHANNEL
  kind: 'ready'
}

/** iframe → host: incremental test results (assertions + script execution errors). */
export type SandboxTestResultsMessage = {
  channel: typeof SANDBOX_CHANNEL
  kind: 'test-results'
  id: string
  results: TestResult[]
}

/** iframe → host: a console call made by the script. */
export type SandboxConsoleMessage = {
  channel: typeof SANDBOX_CHANNEL
  kind: 'console'
  id: string
  level: keyof ConsoleContext
  args: unknown[]
}

/** iframe → host: the script finished (successfully or with an error). */
export type SandboxDoneMessage = {
  channel: typeof SANDBOX_CHANNEL
  kind: 'done'
  id: string
  variables?: {
    local?: SerializableVariableValues
    collection?: SerializableVariableValues
    globals?: SerializableVariableValues
    environment?: SerializableVariableValues
  }
  /** Mutated postman request (`execution.request`) for pre-request scripts. */
  request?: PostmanRequestDefinition
  error?: string
}

export type SandboxOutboundMessage =
  | SandboxReadyMessage
  | SandboxTestResultsMessage
  | SandboxConsoleMessage
  | SandboxDoneMessage
