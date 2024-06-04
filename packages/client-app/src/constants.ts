import type { Icon } from '@scalar/components'

export const themeClasses = {
  view: 't-app__view',
  sidebar: 't-app__sidebar',
  sideNav: 't-app__side-nav',
  topTav: 't-app__top-nav',
  topContainer: 't-app__top-container',
  omnibar: 't-app__omnibar',
} as const

export type Route = { label: string; icon: Icon; path: string }

export const ROUTES: Route[] = [
  { label: 'Requests', icon: 'ExternalLink', path: '/request' },
  { label: 'Cookies', icon: 'Cookie', path: '/cookies' },
  { label: 'Environment', icon: 'Brackets', path: '/environment' },
  { label: 'Servers', icon: 'CodeFolder', path: '/servers' },
  { label: 'Git Sync', icon: 'Branch', path: '/git-sync' },
] as const
