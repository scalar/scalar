import { parseFragment } from 'parse5'

const BLOCK = new Set(
  'address article aside blockquote body caption center col colgroup dd details dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html iframe legend li link main menu menuitem meta nav noframes ol optgroup option p param pre section source summary table tbody td tfoot th thead title tr track ul'.split(
    ' ',
  ),
)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/**
 * Canonical HTML: decoded entities, sorted attributes, and whitespace collapsed
 * the way the browser renders it with `white-space: normal`. A run of spaces is
 * one space; a space right after another collapsible space is dropped, even
 * across an inline element boundary; spaces at the start and end of a line
 * (block edges, around `<br>`) are dropped. Two outputs that normalize the same
 * render the same text; `pre` keeps its whitespace exactly.
 */
export const normalize = (html, { dropAttrs = [] } = {}) => {
  let out = ''
  /** Whether the last rendered character was collapsible space, or a line start. */
  let space = true
  const walk = (node, pre) => {
    for (const c of node.childNodes ?? []) {
      if (c.nodeName === '#text') {
        if (pre) {
          out += esc(c.value)
          space = false
          continue
        }
        let v = esc(c.value).replace(/[ \t\n\r\f]+/g, ' ')
        if (space && v.startsWith(' ')) v = v.slice(1)
        if (v) space = v.endsWith(' ')
        out += v
      } else if (c.nodeName === '#comment') out += '<!--' + c.data + '-->'
      else if (c.tagName) {
        const tag = c.tagName
        const attrs = c.attrs
          .filter((a) => !dropAttrs.includes(a.name))
          .map(
            (a) =>
              ' ' +
              a.name +
              '="' +
              esc(
                a.name === 'href' || a.name === 'src'
                  ? (() => {
                      try {
                        return decodeURI(a.value)
                      } catch {
                        return a.value
                      }
                    })()
                  : a.value,
              ) +
              '"',
          )
          .sort()
          .join('')
        if (BLOCK.has(tag) || tag === 'br') space = true
        if (BLOCK.has(tag)) out += '\n'
        out += '<' + tag + attrs + '>'
        if (BLOCK.has(tag)) out += '\n'
        walk(c.tagName === 'template' ? c.content : c, pre || tag === 'pre')
        if (!['br', 'hr', 'img', 'input', 'source', 'wbr', 'meta', 'link', 'col'].includes(tag)) {
          if (BLOCK.has(tag)) out += '\n'
          out += '</' + tag + '>'
          if (BLOCK.has(tag)) {
            out += '\n'
            space = true
          }
        }
      }
    }
  }
  walk(parseFragment(html), false)
  return (
    out
      // A space at the end of a line (before a block edge or a `<br>`) does not render.
      .replace(/ ((?:<\/[a-z0-9]+>)*)(?=\n|<br>)/g, '$1')
      .replace(/[ \t]*\n[ \t\n]*/g, '\n')
      .trim()
  )
}
