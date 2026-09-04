import { faker } from '@faker-js/faker'
import { getQuickJS } from 'quickjs-emscripten'

import type { StoreInterface } from './store-wrapper'

/**
 * Maximum memory the sandboxed guest may allocate. Handler and seed code only
 * shuffles small amounts of mock data around, so this is generous while still
 * bounding a runaway allocation.
 */
const MEMORY_LIMIT_BYTES = 64 * 1024 * 1024

/**
 * Maximum wall-clock time a single handler or seed run may take. This is the
 * only defence against an infinite loop, since the guest cannot reach anything
 * else on the host.
 */
const EXECUTION_TIMEOUT_MS = 1_000

/**
 * Property names that let code climb from an object onto its prototype chain and
 * ultimately reach the host `Function` constructor. They are never legitimate
 * faker module or method names, so the bridge refuses to walk through them.
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** Store methods the guest bridge is allowed to call. */
const STORE_METHODS = new Set<keyof StoreInterface>(['list', 'get', 'create', 'update', 'delete', 'clear'])

/**
 * The QuickJS WebAssembly module is expensive to instantiate, so it is loaded
 * once and shared. Each run still gets its own isolated context and runtime.
 */
let quickJSModule: ReturnType<typeof getQuickJS> | undefined
const loadQuickJS = () => (quickJSModule ??= getQuickJS())

/**
 * Options for {@link runInSandbox}.
 */
type RunInSandboxOptions = {
  /** User-supplied handler or seed code. It runs inside an async wrapper, so top-level `return` and `await` work. */
  code: string
  /** Host store bridge (already wrapped with operation tracking). */
  store: StoreInterface
  /** Plain-JSON values exposed to the guest as globals (for example `req`, `res`, `schema`). */
  jsonGlobals?: Record<string, unknown>
  /** When true, exposes the guest-side `seed` helper. Requires a `schema` entry in {@link jsonGlobals}. */
  includeSeed?: boolean
}

/**
 * Envelope returned by the host bridges. Errors are marshaled as data instead of
 * thrown so nothing but plain JSON ever crosses the sandbox boundary.
 */
type BridgeEnvelope = { ok: true; value: unknown } | { ok: false; error: string }

/**
 * Walk faker with a guest-provided property path and invoke the resolved method.
 * The faker instance lives on the host; only the path and JSON arguments cross
 * the boundary, so guest code can never obtain a reference to faker itself.
 */
function callFaker(path: string[], args: unknown[]): unknown {
  const method = path.at(-1)

  if (method === undefined || FORBIDDEN_KEYS.has(method)) {
    throw new Error(`faker: "${method}" is not accessible`)
  }

  // Resolve everything except the last segment to the faker module owning the method.
  let receiver: any = faker

  for (const key of path.slice(0, -1)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`faker: "${key}" is not accessible`)
    }

    receiver = receiver?.[key]

    if (receiver === undefined || receiver === null) {
      throw new Error(`faker: "${key}" does not exist`)
    }
  }

  const fn = receiver?.[method]

  if (typeof fn !== 'function') {
    throw new Error(`faker: "${path.join('.')}" is not a function`)
  }

  // Bind to the resolved module so faker methods keep their expected `this`.
  return fn.apply(receiver, args)
}

/**
 * Run a store method requested by the guest and return a JSON envelope.
 */
function runStoreBridge(store: StoreInterface, method: string, argsJson: string): string {
  try {
    if (!STORE_METHODS.has(method as keyof StoreInterface)) {
      throw new Error(`store: "${method}" is not a method`)
    }

    const args = JSON.parse(argsJson) as unknown[]
    const result = (store[method as keyof StoreInterface] as (...args: unknown[]) => unknown)(...args)

    return serializeEnvelope({ ok: true, value: result ?? null })
  } catch (error) {
    return serializeEnvelope({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Run a faker call requested by the guest and return a JSON envelope.
 */
function runFakerBridge(pathJson: string, argsJson: string): string {
  try {
    const path = JSON.parse(pathJson) as string[]
    const args = JSON.parse(argsJson) as unknown[]

    return serializeEnvelope({ ok: true, value: callFaker(path, args) ?? null })
  } catch (error) {
    return serializeEnvelope({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Serialize a bridge envelope. Faker occasionally returns values such as `Date`
 * that JSON cannot represent as-is; those are converted to their JSON form,
 * which matches what handler code would send over the wire anyway.
 */
function serializeEnvelope(envelope: BridgeEnvelope): string {
  return JSON.stringify(envelope)
}

/**
 * Guest-side bootstrap. It rebuilds `store` and `faker` on top of the host
 * bridges so guest code sees the same API as before, but every call is just a
 * JSON message to the host.
 */
const GUEST_PRELUDE = `
  const __unwrap = (raw) => {
    const parsed = JSON.parse(raw)
    if (!parsed.ok) {
      throw new Error(parsed.error)
    }
    return parsed.value
  }

  const store = {
    list: (...args) => __unwrap(__store('list', JSON.stringify(args))),
    get: (...args) => __unwrap(__store('get', JSON.stringify(args))),
    create: (...args) => __unwrap(__store('create', JSON.stringify(args))),
    update: (...args) => __unwrap(__store('update', JSON.stringify(args))),
    delete: (...args) => __unwrap(__store('delete', JSON.stringify(args))),
    clear: (...args) => __unwrap(__store('clear', JSON.stringify(args))),
  }

  const __makeFaker = (path) =>
    new Proxy(function () {}, {
      get: (_target, prop) => (typeof prop === 'string' ? __makeFaker(path.concat(prop)) : undefined),
      apply: (_target, _thisArg, args) => __unwrap(__faker(JSON.stringify(path), JSON.stringify(args))),
    })
  const faker = __makeFaker([])
`

/**
 * Guest-side `seed` helper. It mirrors the Laravel-inspired API and runs the
 * factory callbacks inside the sandbox, persisting through the `store` bridge.
 */
const SEED_PRELUDE = `
  const seed = (() => {
    const create = (item) => store.create(schema, item)
    const helper = (arg1, arg2) => {
      if (typeof arg1 === 'number' && typeof arg2 === 'function') {
        const items = []
        for (let index = 0; index < arg1; index++) {
          items.push(create(arg2()))
        }
        return items
      }
      if (Array.isArray(arg1)) {
        return arg1.map(create)
      }
      if (typeof arg1 === 'function') {
        return create(arg1())
      }
      throw new Error('Invalid seed() usage. Use seed.count(n, factory), seed(array), or seed(factory)')
    }
    helper.count = (n, factory) => {
      const items = []
      for (let index = 0; index < n; index++) {
        items.push(create(factory()))
      }
      return items
    }
    return helper
  })()
`

/**
 * Assemble the full guest program: bridges, injected JSON globals, the optional
 * seed helper, and the user code wrapped in an async IIFE whose result becomes
 * the completion value QuickJS hands back.
 */
function buildGuestSource(code: string, jsonGlobalNames: string[], includeSeed: boolean): string {
  const jsonGlobals = jsonGlobalNames.map((name) => `const ${name} = JSON.parse(__json_${name})`).join('\n')

  return `
    ${GUEST_PRELUDE}
    ${jsonGlobals}
    ${includeSeed ? SEED_PRELUDE : ''}
    ;(async () => {
      ${code}
    })()
  `
}

/**
 * Rebuild a host error from a dumped QuickJS error so callers see a normal
 * `Error` instead of an opaque value.
 */
function toError(dumped: unknown): Error {
  if (dumped instanceof Error) {
    return dumped
  }

  if (dumped && typeof dumped === 'object' && 'message' in dumped) {
    const error = new Error(String((dumped as { message: unknown }).message))
    const name = (dumped as { name?: unknown }).name
    if (typeof name === 'string') {
      error.name = name
    }
    return error
  }

  return new Error(typeof dumped === 'string' ? dumped : 'Sandbox execution failed')
}

/**
 * Execute untrusted handler or seed code inside a QuickJS WebAssembly sandbox.
 *
 * The guest has no access to the host runtime (`process`, `require`, `fetch`,
 * the `Function` constructor, and so on). It can only talk to the `store` and
 * `faker` bridges and read the injected JSON globals. Memory and time limits
 * bound the remaining denial-of-service risk.
 */
export async function runInSandbox(options: RunInSandboxOptions): Promise<unknown> {
  const { code, store, jsonGlobals = {}, includeSeed = false } = options

  const quickJS = await loadQuickJS()
  const context = quickJS.newContext()

  try {
    const { runtime } = context
    runtime.setMemoryLimit(MEMORY_LIMIT_BYTES)

    const deadline = Date.now() + EXECUTION_TIMEOUT_MS
    runtime.setInterruptHandler(() => Date.now() > deadline)

    // Host bridge: store operations run the real (tracked) store and return JSON.
    const storeBridge = context.newFunction('__store', (methodHandle, argsHandle) =>
      context.newString(runStoreBridge(store, context.getString(methodHandle), context.getString(argsHandle))),
    )
    context.setProp(context.global, '__store', storeBridge)
    storeBridge.dispose()

    // Host bridge: faker. Only a property path and JSON arguments cross the boundary.
    const fakerBridge = context.newFunction('__faker', (pathHandle, argsHandle) =>
      context.newString(runFakerBridge(context.getString(pathHandle), context.getString(argsHandle))),
    )
    context.setProp(context.global, '__faker', fakerBridge)
    fakerBridge.dispose()

    // Inject read-only inputs (req/res/schema) as JSON strings the guest parses.
    for (const [name, value] of Object.entries(jsonGlobals)) {
      const handle = context.newString(JSON.stringify(value ?? null))
      context.setProp(context.global, `__json_${name}`, handle)
      handle.dispose()
    }

    const evalResult = context.evalCode(buildGuestSource(code, Object.keys(jsonGlobals), includeSeed))

    if (evalResult.error) {
      const error = context.dump(evalResult.error)
      evalResult.error.dispose()
      throw toError(error)
    }

    // The completion value is the async IIFE's promise. Resolve it, then drain the
    // job queue; every host bridge is synchronous, so one pass settles the promise.
    const promiseHandle = evalResult.value
    const resolved = context.resolvePromise(promiseHandle)
    promiseHandle.dispose()

    const jobs = runtime.executePendingJobs()
    if (jobs.error) {
      const error = context.dump(jobs.error)
      jobs.error.dispose()
      throw toError(error)
    }

    const settled = await resolved
    if (settled.error) {
      const error = context.dump(settled.error)
      settled.error.dispose()
      throw toError(error)
    }

    const value = context.dump(settled.value)
    settled.value.dispose()

    return value
  } finally {
    context.dispose()
  }
}
