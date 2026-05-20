import type { ICONS } from '../icons'
import type { LOGOS } from '../logos'

/** @deprecated Use the icons from the `@scalar/icons` package instead. */
export type Icon = (typeof ICONS)[number]

/** @deprecated Use the icons from the `@scalar/icons` package instead. */
export type Logo = (typeof LOGOS)[number]

const icons = import.meta.glob<SVGElement>('../icons/*.svg', {
  query: 'component',
  eager: true,
})

const logos = import.meta.glob<SVGElement>('../logos/*.svg', {
  query: 'component',
  eager: true,
})

/**
 * Generate a Vue component from the icon SVGs
 *
 * For any changes to this file, please ensure it works with SSR
 */
export const getIcon = (name: Icon) => {
  const filename = `../icons/${name}.svg`

  if (!icons[filename]) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }

  return icons[filename]
}

/**
 * Generate a Vue component from the logo SVGs
 *
 * For any changes to this file, please ensure it works with SSR
 */
export const getLogo = (name: Logo) => {
  const filename = `../logos/${name}.svg`

  if (!logos[filename]) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }
  return logos[filename]
}
