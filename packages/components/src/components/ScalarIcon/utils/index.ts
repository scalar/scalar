import type { ICONS } from '../icons'
import type { LOGOS } from '../logos'
import { markRaw, type Component } from 'vue'

/** @deprecated Use the icons from the `@scalar/icons` package instead. */
export type Icon = (typeof ICONS)[number]

/** @deprecated Use the icons from the `@scalar/icons` package instead. */
export type Logo = (typeof LOGOS)[number]

const icons = import.meta.glob<SVGElement>('../icons/*.svg', {
  query: 'component',
  import: 'default',
  eager: false,
})

const logos = import.meta.glob<SVGElement>('../logos/*.svg', {
  query: 'component',
  import: 'default',
  eager: false,
})

const iconCache = new Map<Icon, Component>()
const logoCache = new Map<Logo, Component>()

/**
 * Generate a Vue component from the icon SVGs
 *
 * For any changes to this file, please ensure it works with SSR
 */
export const getIcon = async (name: Icon): Promise<Component | null> => {
  const cached = iconCache.get(name)
  if (cached) {
    return cached
  }

  const filename = `../icons/${name}.svg`
  const loader = icons[filename]

  if (!loader) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }

  const icon = markRaw(await loader())
  iconCache.set(name, icon)
  return icon
}

/**
 * Generate a Vue component from the logo SVGs
 *
 * For any changes to this file, please ensure it works with SSR
 */
export const getLogo = async (name: Logo): Promise<Component | null> => {
  const cached = logoCache.get(name)
  if (cached) {
    return cached
  }

  const filename = `../logos/${name}.svg`
  const loader = logos[filename]

  if (!loader) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }

  const logo = markRaw(await loader())
  logoCache.set(name, logo)
  return logo
}
