import { type InjectionKey, inject } from 'vue'

/** Share the reference routing configuration with links inside operation content. */
export const NAVIGATION_HREF: InjectionKey<(id: string) => string> = Symbol('navigation-href')

/** Standalone content uses its DOM anchors when no reference router is present. */
export const useNavigationHref = (): ((id: string) => string) =>
  inject(NAVIGATION_HREF, (id: string): string => `#${encodeURIComponent(id)}`)
