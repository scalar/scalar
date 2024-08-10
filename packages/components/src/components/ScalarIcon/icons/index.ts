import type { ICONS } from './icons'

export type Icon = (typeof ICONS)[number]

const icons = import.meta.glob<SVGElement>('./*.svg', {
  query: 'component',
  eager: true,
})

/**
 * Generate a vue component from the icon SVGs
 *
 * For any changes to this file, please ensure it works with SSR
 */
export const getIcon = (name: Icon) => {
  const filename = `./${name}.svg`

  if (!icons[filename]) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }
  return icons[filename]
}
