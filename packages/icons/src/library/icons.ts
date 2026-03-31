import { markRaw, type Component } from 'vue'

import type { LibraryIconDefinition } from './types'

const iconLoaders: Record<string, () => Promise<Component>> = import.meta.glob('./icons/*.svg', {
  eager: false,
})

const iconNames = Object.keys(iconLoaders).map((filename) => filename.replace('./icons/', '').replace('.svg', ''))

/** Icon list for icon selector */
export const libraryIcons: LibraryIconDefinition[] = iconNames.map((name) => ({
  src: name,
  title: name.replaceAll('-', ' '),
  tags: [],
}))

const iconCache = new Map<string, Component>()

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
