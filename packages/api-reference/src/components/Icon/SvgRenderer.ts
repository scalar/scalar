import { type FunctionalComponent, type SVGAttributes, h } from 'vue'

type RendererProps = {
  raw: string
  // All other attributes
} & SVGAttributes

const attrsToObject = (m: NamedNodeMap) =>
  Object.fromEntries(Array.from(m).map((t) => [t.name, t.value]))

// Use a DOMParser library if it's not in the browser
const Parser = typeof DOMParser === 'undefined'
  ? (await import('xmldom')).DOMParser
  : DOMParser

/**
 * Utility component to convert a raw SVG string to a Vue vnode.
 *
 * @param {string} raw A raw string containing an SVG element.
 * @returns An SVG vnode or `undefined` if unparsable.
 */
const Renderer: FunctionalComponent<RendererProps> = ({ raw }) => {
  const parser = new Parser()
  const parsed = parser.parseFromString(raw, 'image/svg+xml')
  if (parsed.getElementsByTagName('parsererror').length) return undefined

  const svg = parsed.documentElement
  const attrs = attrsToObject(svg.attributes)

  // Strip width and height attributes
  const { width, height, ...rest } = attrs

  return h('svg', { ...rest, innerHTML: svg.innerHTML })
}

Renderer.props = {
  raw: {
    type: String,
    required: true,
  },
}

export default Renderer
