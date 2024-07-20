import { defineAsyncComponent, h } from 'vue'

import type { ICONS } from './icons'

export type Icon = (typeof ICONS)[number]

const icons = import.meta.glob<SVGElement>('./*.svg')

/**
 * Generate a vue component from the icon SVGs
 */
export const getIcon = (name: Icon) => {
  const filename = `./${name}.svg`

  if (!icons[filename]) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }

  return defineAsyncComponent({
    loader: icons[filename]!,
    // Provide a square svg as a placeholder while the icon loads
    loadingComponent: () => h('svg', { viewBox: '0 0 1 1' }),
    delay: 0,
  })
}
