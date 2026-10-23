import { parseFragment } from 'parse5'

const BLOCK = new Set(
  'address article aside blockquote body caption center col colgroup dd details dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html iframe legend li link main menu menuitem meta nav noframes ol optgroup option p param pre section source summary table tbody td tfoot th thead title tr track ul'.split(
    ' ',
  ),
)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Canonical HTML: decoded entities, sorted attributes, collapsed whitespace, none around block tags. */
export const normalize = (html, { dropAttrs = [] } = {}) => {
  let out = ''
  const walk = (node, pre) => {
    for (const c of node.childNodes ?? []) {
      if (c.nodeName === '#text') out += pre ? esc(c.value) : esc(c.value).replace(/\s+/g, ' ')
      else if (c.nodeName === '#comment') out += '<!--' + c.data + '-->'
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
        if (BLOCK.has(tag)) out += '\n'
        out += '<' + tag + attrs + '>'
        if (BLOCK.has(tag)) out += '\n'
        walk(c.tagName === 'template' ? c.content : c, pre || tag === 'pre')
        if (!['br', 'hr', 'img', 'input', 'source', 'wbr', 'meta', 'link', 'col'].includes(tag)) {
          if (BLOCK.has(tag)) out += '\n'
          out += '</' + tag + '>'
          if (BLOCK.has(tag)) out += '\n'
        }
      }
    }
  }
  walk(parseFragment(html), false)
  return out.replace(/[ \t]*\n[ \t\n]*/g, '\n').trim()
}
