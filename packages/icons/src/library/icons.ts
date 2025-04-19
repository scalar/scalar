import type { LibraryIconDefinition } from './types'
import type { Component } from 'vue'

const iconsImported: Record<string, Component> = import.meta.glob('./icons/*.svg', {
  eager: true,
})

function mapLocalIcons(imported: Record<string, Component>) {
  const formatted = Object.entries(imported).map(([filename, rawData]) => {
    // Create a name from the import path
    const name = filename.replace('./icons/', '').replace('.svg', '')

    const icon: LibraryIconDefinition = {
      // Prefix the src with the group so that the final flat icon map has unique keys
      src: name,
      title: name.replaceAll('-', ' '),
      tags: [],
    }
    return {
      icon,
      rawData,
    }
  })

  const iconDefinitionList = formatted.map((e) => e.icon)

  const iconDataMap = Object.fromEntries<Component>(formatted.map((e) => [e.icon.src, e.rawData]))
  return {
    iconDefinitionList,
    iconDataMap,
  }
}

const icons = mapLocalIcons(iconsImported)

/** Icon list for icon selector */
export const libraryIcons: LibraryIconDefinition[] = icons.iconDefinitionList

/** Raw SVG strings */
const iconData: Record<string, Component> = icons.iconDataMap

export const getLibraryIcon = (src: string): Component | undefined => {
  return iconData[src]
}
