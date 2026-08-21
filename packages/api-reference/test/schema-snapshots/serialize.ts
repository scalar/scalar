/**
 * Turns rendered schema markup into a normalized, human readable tree.
 *
 * These snapshots exist to survive component refactors, so we serialize the
 * *meaning* of the rendering (names, types, constraints, flags, nesting) rather
 * than the markup. Only the semantic class hooks listed below are read; wrapper
 * elements, scoped style attributes and Tailwind classes are walked straight
 * through and never end up in a snapshot.
 *
 * That trade is deliberate: restructuring the components leaves the snapshots
 * untouched, while a change in what we actually render shows up as a readable
 * one line diff.
 */

/** Indentation used for one level of nesting. */
const INDENT = '  '

/**
 * Flags rendered as standalone elements in the property heading.
 *
 * Emitted in this fixed order rather than DOM order so that reordering the
 * template does not churn every snapshot.
 */
const FLAGS = [
  ['.property-required', 'required'],
  ['.property-deprecated', 'deprecated'],
  ['.property-read-only', 'read-only'],
  ['.property-write-only', 'write-only'],
  ['.property-discriminator', 'discriminator'],
  ['.property-additional', 'additional properties'],
] as const

/**
 * Collapses runs of whitespace into single spaces.
 *
 * `\s` covers the non breaking spaces the detail prefixes render with, so they
 * normalize away here too.
 */
const normalizeText = (value: string | null | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim()

/** Reads the trimmed text of the first match, or an empty string when absent. */
const textOf = (element: Element, selector: string): string =>
  normalizeText(element.querySelector(selector)?.textContent)

/** Reads the trimmed text of every match. */
const textsOf = (element: Element, selector: string): string[] =>
  [...element.querySelectorAll(selector)].map((node) => normalizeText(node.textContent)).filter(Boolean)

/**
 * Renders one `.property-detail` as a single token.
 *
 * Details come in two shapes: a bare value (`integer`) and a prefixed value
 * (`max length: 50`), so we join the two parts when a prefix is present.
 */
const serializeDetail = (detail: Element): string => {
  const prefix = textOf(detail, '.property-detail-prefix').replace(/:$/, '')
  const value = textOf(detail, '.property-detail-value')

  if (!prefix) {
    return value
  }

  return value ? `${prefix}: ${value}` : prefix
}

/**
 * Serializes a single property row: `name: type · constraint {flags}`.
 *
 * The heading is scoped to this property so nested children never leak into
 * their parent's line.
 */
const serializeProperty = (property: Element, depth: number): string[] => {
  const lines: string[] = []
  const pad = INDENT.repeat(depth)
  const heading = property.querySelector(':scope > .property-heading')

  const name = heading ? textOf(heading, ':scope > .property-name') : ''
  const details = heading ? [...heading.querySelectorAll('.property-detail')].map(serializeDetail).filter(Boolean) : []
  const flags = heading ? FLAGS.filter(([selector]) => heading.querySelector(selector)).map(([, label]) => label) : []

  const description = textOf(property, ':scope > .property-description')
  const defaultValue = heading ? textOf(heading, '.property-default-value') : ''
  const examples = heading ? textsOf(heading, '.property-example-value') : []

  // A composition at the root is wrapped in a property row that carries nothing of
  // its own. Collapsing it keeps the snapshot about the schema rather than the
  // scaffolding the components happen to need.
  const isTransparentWrapper =
    !name && !details.length && !flags.length && !description && !defaultValue && !examples.length

  if (isTransparentWrapper) {
    return walk(property, depth, new Set([heading]))
  }

  const signature = [name, details.join(' · '), flags.length ? `{${flags.join(', ')}}` : ''].filter(Boolean).join(' — ')

  lines.push(`${pad}- ${signature}`)

  // Everything below the signature is indented one step further so the tree reads
  // top down: description, then default/examples, then nested content.
  const detailPad = INDENT.repeat(depth + 1)

  if (description) {
    lines.push(`${detailPad}description: ${description}`)
  }

  if (defaultValue) {
    lines.push(`${detailPad}default: ${defaultValue}`)
  }

  if (examples.length) {
    lines.push(`${detailPad}examples: ${examples.join(' | ')}`)
  }

  lines.push(...walk(property, depth + 1, new Set([heading])))

  return lines
}

/**
 * Serializes a composition block.
 *
 * Only the selected branch is rendered by the component, so the snapshot records
 * which branch is on screen. See the README for the branch coverage caveat.
 */
const serializeComposition = (rule: Element, depth: number): string[] => {
  const pad = INDENT.repeat(depth)
  const selector = rule.querySelector('.composition-selector')
  const selected = textOf(rule, '.composition-selector-label')

  // The label sits in the first span of the selector, before the selected value.
  const label = selector ? normalizeText(selector.firstElementChild?.textContent) : ''

  // allOf has no selector: its members render inline as one merged list, so we walk
  // straight through instead of announcing a block that is not on screen.
  if (!selector) {
    return walk(rule, depth)
  }

  return [`${pad}${label || 'composition'} → showing "${selected}"`, ...walk(rule, depth + 1, new Set([selector]))]
}

/** Serializes an enum block as a single `values:` line. */
const serializeEnum = (enumBlock: Element, depth: number): string[] => {
  const pad = INDENT.repeat(depth)
  const label = textOf(enumBlock, '.property-enum-property-names') || 'values'
  const values = textsOf(enumBlock, '.property-enum-value-label')
  const descriptions = textsOf(enumBlock, '.property-enum-value-description')

  const lines = [`${pad}${label}: ${values.join(' | ')}`]

  // Long lists render behind a toggle. Without this the snapshot would look like a
  // complete list when most of the values are hidden.
  if (enumBlock.querySelector('.enum-toggle-button')) {
    lines.push(`${pad}${INDENT}(truncated, more behind a toggle)`)
  }

  if (descriptions.length) {
    lines.push(`${pad}${INDENT}value descriptions: ${descriptions.join(' | ')}`)
  }

  return lines
}

/**
 * Walks an element's children, emitting meaningful nodes and descending
 * transparently through everything else.
 *
 * Walking children (rather than querying descendants) is what keeps the
 * serializer independent of how deeply the components nest their wrappers.
 */
const walk = (element: Element, depth: number, skip: Set<Element | null> = new Set()): string[] => {
  const lines: string[] = []

  for (const child of element.children) {
    if (skip.has(child)) {
      continue
    }

    if (child.matches('.property')) {
      lines.push(...serializeProperty(child, depth))
    } else if (child.matches('.property-rule')) {
      lines.push(...serializeComposition(child, depth))
    } else if (child.matches('.property-enum')) {
      lines.push(...serializeEnum(child, depth))
    } else if (child.matches('.schema-card-description')) {
      const description = normalizeText(child.textContent)
      if (description) {
        lines.push(`${INDENT.repeat(depth)}description: ${description}`)
      }
    } else if (child.matches('.property-description')) {
      // Handled by serializeProperty; skip so it is not emitted twice.
      continue
    } else {
      lines.push(...walk(child, depth, skip))
    }
  }

  return lines
}

/**
 * Serializes rendered schema markup into the snapshot body.
 *
 * @param html - The rendered markup, e.g. from `mount(Schema).html()`.
 */
export const serializeSchemaRendering = (html: string): string => {
  const container = document.createElement('div')
  container.innerHTML = html

  // Screen reader labels repeat information the line already carries ("Type:",
  // "Format:"), so drop them before reading any text.
  for (const node of container.querySelectorAll('.screenreader-only')) {
    node.remove()
  }

  const lines = walk(container, 0)

  return lines.length ? lines.join('\n') : '(nothing rendered)'
}
