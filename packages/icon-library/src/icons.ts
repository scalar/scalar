import type { IconDefinition } from '@/types'
import type { Component } from 'vue'

const iconsSolid: Record<string, Component> = import.meta.glob(
  './solid/*.svg',
  { eager: true },
)
const iconsLine: Record<string, Component> = import.meta.glob('./line/*.svg', {
  eager: true,
})
const iconsBrand: Record<string, Component> = import.meta.glob(
  './brand/*.svg',
  { eager: true },
)

function mapLocalIcons(
  imported: Record<string, Component>,
  group: 'solid' | 'line' | 'brand',
) {
  const formatted = Object.entries(imported).map(([filename, rawData]) => {
    // Create a name from the import path
    const name = filename
      .replace('./solid/', '')
      .replace('./line/', '')
      .replace('./brand/', '')
      .replace('.svg', '')

    const icon: IconDefinition = {
      // Prefix the src with the group so that the final flat icon map has unique keys
      src: `${group}/${name}`,
      title: name.replaceAll('-', ' '),
      group,
      tags: [],
    }
    return {
      icon,
      rawData,
    }
  })

  const iconDefinitionList = formatted.map((e) => e.icon)

  const iconDataMap = Object.fromEntries<Component>(
    formatted.map((e) => [e.icon.src, e.rawData]),
  )
  return {
    iconDefinitionList,
    iconDataMap,
  }
}

const solid = mapLocalIcons(iconsSolid, 'solid')
const line = mapLocalIcons(iconsLine, 'line')
const brand = mapLocalIcons(iconsBrand, 'brand')

/** Icon list for icon selector */
export const libraryIcons: IconDefinition[] = [
  ...solid.iconDefinitionList,
  ...line.iconDefinitionList,
  ...brand.iconDefinitionList,
]

/** Raw SVG strings */
const iconData: Record<string, Component> = {
  ...solid.iconDataMap,
  ...line.iconDataMap,
  ...brand.iconDataMap,
}

export const getLibraryIcon = (src: string): Component | undefined => {
  return iconData[src]
}
