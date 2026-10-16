import { type InjectionKey, inject } from 'vue'

/** Share the reference routing configuration with links inside operation content. */
export const NAVIGATION_HREF: InjectionKey<(id: string) => string> = Symbol('navigation-href')

/** Standalone content uses its DOM anchors when no reference router is present. */
export const useNavigationHref = (): ((id: string) => string) =>
  inject(NAVIGATION_HREF, (id: string): string => `#${encodeURIComponent(id)}`)

/** Modified clicks keep native link behavior such as opening a new tab. */
export const isPlainClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
