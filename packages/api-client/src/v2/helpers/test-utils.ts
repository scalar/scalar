import { type NavigationEventBus, createNavigation, withNavigation } from '@scalar/workspace-store/events'
import { vi } from 'vitest'

/** Creates a fresh mock event bus instance for testing */
export const createMockEventBus = (): NavigationEventBus => {
  const eventBus = {
    on: vi.fn(() => vi.fn()),
    once: vi.fn(() => vi.fn()),
    off: vi.fn(),
    onAny: vi.fn(() => vi.fn()),
    offAny: vi.fn(),
    emit: vi.fn(() => null),
    flushDebouncedEmits: vi.fn(),
  } as unknown as NavigationEventBus
  const primary = createNavigation(eventBus, {
    'select:nav-item': () => undefined,
    'scroll-to:nav-item': () => undefined,
    'scroll-to:model-by-name': () => undefined,
    'ui:navigate': () => undefined,
    'ui:open:settings': () => undefined,
    'ui:open:client-modal': () => undefined,
    'tabs:navigate:previous': () => undefined,
    'tabs:navigate:next': () => undefined,
    'tabs:focus:tab': () => undefined,
    'tabs:focus:tab-last': () => undefined,
  })
  return withNavigation(eventBus, primary.navigation)
}

/** Mock event bus for all your testing needs */
export const mockEventBus = createMockEventBus()
