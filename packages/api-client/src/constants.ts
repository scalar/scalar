import type { Icon } from '@scalar/components'

export type Route = { label: string; icon: Icon; path: string }

export const ROUTES: Route[] = [
  { label: 'Requests', icon: 'ExternalLink', path: '/request' },
  { label: 'Cookies', icon: 'Cookie', path: '/cookies' },
  { label: 'Environment', icon: 'Brackets', path: '/environment' },
  { label: 'Servers', icon: 'Server', path: '/servers' },
  // { label: 'Git Sync', icon: 'Branch', path: '/git-sync' },
] as const
