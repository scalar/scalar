import { type ICONS } from './icons'

const icons = import.meta.glob('./*.svg', { as: 'raw', eager: true })

export const getIcon = (name: string) => {
  const filename = `./${name}.svg`

  if (icons[filename] === undefined) {
    console.warn(`Could not find icon: ${name}`)
    return ''
  }

  return icons[filename]
}

export type Icon = (typeof ICONS)[number]
