import type { WorkspaceEventBus } from './bus'
import type { NavigationEvents } from './definitions'

type NavigationEvent = keyof NavigationEvents

type NavigationHandler<E extends NavigationEvent> = undefined extends NavigationEvents[E]
  ? (payload?: NavigationEvents[E]) => void | Promise<unknown>
  : (payload: NavigationEvents[E]) => void | Promise<unknown>

/** Primary handlers for the navigation commands owned by a feature. */
export type NavigationHandlers<E extends NavigationEvent = NavigationEvent> = {
  [K in E]: NavigationHandler<K> | false
}

/** Navigation commands a component can invoke, or an explicit disabled capability. */
export type Navigation<E extends NavigationEvent = NavigationEvent> = {
  [K in E]: NavigationHandler<K> | false
}

/** A supported command scope or an explicitly disabled host. */
export type NavigationCapability<E extends NavigationEvent = NavigationEvent> = Navigation<E> | false

/** A notification bus with the navigation capability required by its consumers. */
export type NavigationEventBus<E extends NavigationEvent = NavigationEvent> = WorkspaceEventBus & {
  readonly navigation: NavigationCapability<E>
}

const navigationEvents = {
  'select:nav-item': true,
  'scroll-to:nav-item': true,
  'scroll-to:model-by-name': true,
  'ui:navigate': true,
  'ui:open:settings': true,
  'ui:open:client-modal': true,
  'tabs:navigate:previous': true,
  'tabs:navigate:next': true,
  'tabs:focus:tab': true,
  'tabs:focus:tab-last': true,
} satisfies Record<NavigationEvent, true>

type Registry = { notifying: Map<NavigationEvent, number> }
const registries = new WeakMap<WorkspaceEventBus, Registry>()

const getRegistry = (eventBus: WorkspaceEventBus): Registry => {
  const existing = registries.get(eventBus)
  if (existing) {
    return existing
  }
  const registry: Registry = { notifying: new Map() }
  registries.set(eventBus, registry)
  return registry
}

/** Identify navigation commands when dispatching a mixed event source such as hotkeys. */
export const isNavigationEvent = (event: string): event is NavigationEvent => Object.hasOwn(navigationEvents, event)

/** Register feature-owned primary commands separately from ordinary observers. */
export const createNavigation = <E extends NavigationEvent>(
  eventBus: WorkspaceEventBus,
  handlers: NavigationHandlers<E>,
): { navigation: Navigation<E>; dispose: () => void } => {
  const registry = getRegistry(eventBus)
  const navigation: Partial<Navigation<E>> = {}
  const unsubscribes: (() => void)[] = []
  let disposed = false

  const register = <K extends E>(event: K): void => {
    const handler = handlers[event]
    if (handler === false) {
      navigation[event] = false
      return
    }
    if (typeof handler !== 'function') {
      throw new Error(`[Navigation] Missing primary handler for "${event}".`)
    }
    const dispatch = (payload: NavigationEvents[K] | undefined): void => {
      if (disposed) {
        throw new Error(`[Navigation] Missing primary handler for "${event}".`)
      }
      const result = (handler as (payload: NavigationEvents[K] | undefined) => void | Promise<unknown>)(payload)
      if (result) {
        void result.catch((error: unknown) => console.error(`[Navigation] Handler failed for "${event}":`, error))
      }
    }
    unsubscribes.push(
      eventBus.on(event, (payload: NavigationEvents[K] | undefined) => {
        if (!registry.notifying.has(event)) {
          dispatch(payload)
        }
      }),
    )

    navigation[event] = ((payload: NavigationEvents[K]) => {
      dispatch(payload)
      registry.notifying.set(event, (registry.notifying.get(event) ?? 0) + 1)
      try {
        const notify = eventBus.emit as (
          event: NavigationEvent,
          payload: NavigationEvents[NavigationEvent] | undefined,
          options?: { skipUnpackProxy: boolean },
        ) => void
        if (payload && 'event' in payload) {
          notify(event, payload, { skipUnpackProxy: true })
        } else {
          notify(event, payload)
        }
      } finally {
        const remaining = (registry.notifying.get(event) ?? 1) - 1
        if (remaining === 0) {
          registry.notifying.delete(event)
        } else {
          registry.notifying.set(event, remaining)
        }
      }
    }) as NavigationHandler<K>
  }

  for (const event of Object.keys(handlers) as E[]) {
    if (!isNavigationEvent(event)) {
      throw new Error(`[Navigation] Unknown command "${event}".`)
    }
    if (handlers[event] !== false && typeof handlers[event] !== 'function') {
      throw new Error(`[Navigation] Missing primary handler for "${event}".`)
    }
  }
  for (const event of Object.keys(handlers) as E[]) {
    register(event)
  }

  return {
    navigation: navigation as Navigation<E>,
    dispose: () => {
      disposed = true
      unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe())
    },
  }
}

/** Attach an explicitly supplied capability without changing ordinary event subscriptions. */
export const withNavigation = <E extends NavigationEvent = NavigationEvent>(
  eventBus: WorkspaceEventBus,
  navigation: NavigationCapability<E> | (() => NavigationCapability<E>),
): NavigationEventBus<E> => {
  const result = Object.create(eventBus) as NavigationEventBus<E>
  Object.defineProperty(result, 'navigation', {
    get: () => (typeof navigation === 'function' ? navigation() : navigation),
  })
  registries.set(result, getRegistry(eventBus))
  return result
}

/** Invoke a required navigation capability, failing explicitly for unsupported commands. */
export const navigate = <Scope extends NavigationEvent, E extends Scope>(
  navigation: NavigationCapability<Scope>,
  ...args: undefined extends NavigationEvents[E]
    ? [event: E, payload?: NavigationEvents[E]]
    : [event: E, payload: NavigationEvents[E]]
): void => {
  const [event, payload] = args
  const handler = navigation && navigation[event]
  if (typeof handler !== 'function') {
    throw new Error(`[Navigation] Unsupported or missing command "${event}".`)
  }
  ;(handler as (payload: NavigationEvents[E] | undefined) => void)(payload)
}

/** Whether the host explicitly supports a navigation command. */
export const canNavigate = <E extends NavigationEvent>(navigation: NavigationCapability<E>, event: E): boolean => {
  if (navigation === undefined) {
    throw new Error('[Navigation] A navigation capability is required.')
  }
  if (navigation !== false && navigation[event] === undefined) {
    throw new Error(`[Navigation] Missing capability for "${event}".`)
  }
  return navigation !== false && typeof navigation[event] === 'function'
}
