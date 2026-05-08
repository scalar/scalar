import { type Component, markRaw } from 'vue'

import type { LibraryIconDefinition } from './types'

const iconLoaders: Record<string, () => Promise<Component>> = import.meta.glob('./icons/*.svg', {
  eager: false,
})

// Eagerly bundle the default fallback icon. The sidebar uses this for every
// item without a custom `x-scalar-icon` — i.e. the vast majority of items in
// the typical API document — so it's always wanted at first paint and not
// worth the per-item HTTP request that the dynamic glob otherwise produces.
const defaultIconModule = import.meta.glob<{ default: Component }>('./icons/interface-content-folder.svg', {
  eager: true,
})['./icons/interface-content-folder.svg']

const iconNames = Object.keys(iconLoaders).map((filename) => filename.replace('./icons/', '').replace('.svg', ''))

/** Icon list for icon selector */
export const libraryIcons: LibraryIconDefinition[] = iconNames.map((name) => ({
  src: name,
  title: name.replaceAll('-', ' '),
  tags: [],
}))

const iconCache = new Map<string, Component>()

// Pre-populate the cache for the eagerly-bundled default icon so the first
// `getLibraryIcon('interface-content-folder')` resolves synchronously.
if (defaultIconModule?.default) {
  iconCache.set('interface-content-folder', markRaw(defaultIconModule.default))
}

export async function getLibraryIcon(src: string): Promise<Component | undefined> {
  const cached = iconCache.get(src)
  if (cached) {
    return cached
  }

  const loader = iconLoaders[`./icons/${src}.svg`]
  if (!loader) {
    return undefined
  }

  const mod = await loader()
  const component = markRaw((mod as Record<string, Component>).default ?? mod)
  iconCache.set(src, component)
  return component
}
