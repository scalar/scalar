import {
  type NavigationEventBus,
  type NavigationHandlers,
  createNavigation,
  createWorkspaceEventBus,
  withNavigation,
} from '@scalar/workspace-store/events'

/** Create a standalone component host with explicit mocked navigation handlers. */
export const createNavigationEventBus = (handlers: Partial<NavigationHandlers> = {}): NavigationEventBus => {
  const eventBus = createWorkspaceEventBus()
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
    ...handlers,
  })
  return withNavigation(eventBus, primary.navigation)
}
