const icons = import.meta.glob('./*.svg', { as: 'raw', eager: true })

export const getIcon = (name: string) => {
  const filename = `./${name}.svg`

  if (icons[filename] === undefined) {
    console.warn(`Could not find icon: ${name}`)
    return ''
  }

  return icons[filename]
}

export type Icon =
  | 'Add'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'Background'
  | 'CallToAction'
  | 'Checkmark'
  | 'ChevronDown'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'ChevronUp'
  | 'Close'
  | 'DarkMode'
  | 'Discord'
  | 'Delete'
  | 'Duplicate'
  | 'Edit'
  | 'EditorBold'
  | 'EditorCode'
  | 'EditorHighlight'
  | 'EditorItalic'
  | 'EditorLink'
  | 'EditorStrike'
  | 'EditorUnderline'
  | 'Ellipses'
  | 'Error'
  | 'ExternalLink'
  | 'Folder'
  | 'GitHub'
  | 'Google'
  | 'Hide'
  | 'Key'
  | 'Leave'
  | 'LightMode'
  | 'Link'
  | 'Lock'
  | 'Logo'
  | 'LogoAPI'
  | 'LogoClient'
  | 'LogoMarket'
  | 'LogoSwagger'
  | 'Magic'
  | 'Menu'
  | 'Page'
  | 'Payment'
  | 'Refresh'
  | 'Search'
  | 'Show'
  | 'Sigma'
  | 'Trash'
