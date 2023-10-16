import {
  type FunctionalComponent,
  type SVGAttributes,
  defineAsyncComponent,
  h,
} from 'vue'

type RendererProps = {
  raw: string
  // All other attributes
} & SVGAttributes

const attrsToObject = (m: NamedNodeMap) =>
  Object.fromEntries(Array.from(m).map((t) => [t.name, t.value]))

// Can be the native DOMParser, or xmldom's DOMParser
type DOMParserType = {
  new (): DOMParser
  prototype: DOMParser
}

/**
 * Utility component to convert a raw SVG string to a Vue vnode.
 *
 * @param {string} raw A raw string containing an SVG element.
 * @returns An SVG vnode or `undefined` if unparsable.
 */
const getRendererComponent =
  (Parser: DOMParserType): FunctionalComponent<RendererProps> =>
  ({ raw }) => {
    const parser = new Parser()
    const parsed = parser.parseFromString(raw, 'image/svg+xml')

    if (parsed.getElementsByTagName('parsererror').length) {
      return undefined
    }

    const svg = parsed.documentElement
    const attrs = attrsToObject(svg.attributes)

    // Strip width and height attributes
    const { width, height, ...rest } = attrs

    return h('svg', { ...rest, innerHTML: svg.innerHTML })
  }

export default defineAsyncComponent(async () => {
  // Use a DOMParser library if it's not in the browser
  const Parser =
    typeof DOMParser === 'undefined'
      ? (await import('@xmldom/xmldom')).DOMParser
      : DOMParser

  // Get the actual component, pass the DOMParser
  const Renderer = getRendererComponent(Parser)

  // Add props to it
  Renderer.props = {
    raw: {
      type: String,
      required: true,
    },
  }

  return Renderer
})
