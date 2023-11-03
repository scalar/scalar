import styles from './styles.module.css'
import css from './styles.module.css?raw'

export { parseSwaggerDescription } from './description'
export { findMarkdownHeadings, type Heading } from './headings'

// Apply TS def
const scalarStyles = styles as typeof styles & { markdown: string }
export { scalarStyles }

/**
 * Alternative way to apply scoped styles to the codemirror block
 * Provide a scoping class name and then use that class name on the element
 */
export function useStyles(className: string) {
  const style = document.createElement('style')
  style.innerHTML = css.replaceAll('scalar-reference-markdown', className)
  document.head.appendChild(style)
}
