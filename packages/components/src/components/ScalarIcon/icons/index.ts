import { defineAsyncComponent } from 'vue'

import type { ICONS } from './icons'

export type Icon = (typeof ICONS)[number]

const icons = import.meta.glob<SVGElement>('./*.svg')

/**
 * Generate a vue component from the icon SVGs
 */
export async function getIcon(name: Icon) {
  const filename = `./${name}.svg`

  if (!icons[filename]) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }

  return defineAsyncComponent(icons[filename]!)
}
