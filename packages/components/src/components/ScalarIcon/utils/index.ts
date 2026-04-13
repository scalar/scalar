import type { ICONS } from '../icons'
import type { LOGOS } from '../logos'
import { defineComponent, h, markRaw, type Component } from 'vue'

/** @deprecated Use the icons from the `@scalar/icons` package instead. */
export type Icon = (typeof ICONS)[number]

/** @deprecated Use the icons from the `@scalar/icons` package instead. */
export type Logo = (typeof LOGOS)[number]

const icons = import.meta.glob<SVGElement>('../icons/*.svg', {
  query: 'component',
  import: 'default',
  eager: false,
})

const logos = import.meta.glob<string>('../logos/*.svg', {
  query: 'url',
  import: 'default',
  eager: true,
})

const iconCache = new Map<Icon, Component>()
const logoCache = new Map<Logo, Component>()

const createLogoComponent = (src: string): Component =>
  markRaw(
    defineComponent({
      name: 'ScalarIconLogo',
      inheritAttrs: false,
      setup(_, { attrs }) {
        const label = typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : ''
        return () =>
          h('img', {
            ...attrs,
            alt: label,
            src,
          })
      },
    }),
  )

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
  const logoSrc = logos[filename]

  if (!logoSrc) {
    console.warn(`Could not find icon: ${name}`)
    return null
  }

  const logo = createLogoComponent(logoSrc)
  logoCache.set(name, logo)
  return logo
}
