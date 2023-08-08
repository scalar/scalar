const iconsSolid = import.meta.glob('./solid/*.svg', { as: 'raw', eager: true })
const iconsLine = import.meta.glob('./line/*.svg', { as: 'raw', eager: true })
const iconsBrand = import.meta.glob('./brand/*.svg', { as: 'raw', eager: true })

type ProjectIconDefinition = {
  src: string
  title: string
  group: 'solid' | 'line' | 'brand'
  tags: string[]
}

function mapLocalIcons(
  imported: Record<string, string>,
  group: 'solid' | 'line' | 'brand',
) {
  const formatted = Object.entries(imported).map(([filename, rawData]) => {
    // Create a name from the import path
    const name = filename
      .replace('./solid/', '')
      .replace('./line/', '')
      .replace('./brand/', '')
      .replace('.svg', '')

    const icon: ProjectIconDefinition = {
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

  const iconDataMap = Object.fromEntries<string>(
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
export const localIconList: ProjectIconDefinition[] = [
  ...solid.iconDefinitionList,
  ...line.iconDefinitionList,
  ...brand.iconDefinitionList,
]

/** Raw SVG strings */
const localIconData: Record<string, string> = {
  ...solid.iconDataMap,
  ...line.iconDataMap,
  ...brand.iconDataMap,
}

export const getLocalIcon = (src: string): string | undefined => {
  return localIconData[src]
}
