import { parseFragment, serialize } from 'parse5'

import { PROTOTYPE } from './paths.mjs'

const { htmlFromMarkdown } = await import(PROTOTYPE)

// Independent copy of the policy (from rehype-sanitize's defaultSchema plus Scalar's class rule).
const TAGS = new Set(
  'a b blockquote br code dd del details div dl dt em h1 h2 h3 h4 h5 h6 hr i img input ins kbd li ol p picture pre q rp rt ruby s samp section source span strike strong sub summary sup table tbody td tfoot th thead tr tt ul var'.split(
    ' ',
  ),
)
const GLOBAL = new Set(
  'abbr accept accept-charset accesskey action align alt axis border cellpadding cellspacing char charoff charset checked class clear colspan color cols compact coords datetime dir enctype frame hspace headers height hreflang for id ismap itemprop label lang maxlength media method multiple name nohref noshade nowrap open prompt readonly rev rowspan rows rules scope selected shape size span start summary tabindex title usemap valign value width'.split(
    ' ',
  ),
)
const ARIA = ['aria-describedby', 'aria-label', 'aria-labelledby']
const PER = {
  a: [...ARIA, 'data-footnote-backref', 'data-footnote-ref', 'href', 'rel', 'target'],
  blockquote: ['cite'],
  del: ['cite'],
  ins: ['cite'],
  q: ['cite'],
  div: ['itemscope', 'itemtype'],
  dl: ARIA,
  ol: ARIA,
  ul: ARIA,
  summary: ARIA,
  table: ARIA,
  img: [...ARIA, 'longdesc', 'src'],
  input: ['disabled', 'type'],
  section: ['data-footnotes'],
  source: ['srcset'],
}
const URLS = {
  href: ['http', 'https', 'irc', 'ircs', 'mailto', 'xmpp'],
  cite: ['http', 'https'],
  longdesc: ['http', 'https'],
  src: ['http', 'https'],
}
const VOID = new Set(['br', 'hr', 'img', 'input', 'source', 'wbr'])

const urlOk = (v, list) => {
  // What the browser's URL parser does before looking at the scheme.
  const u = v.replace(/[\t\n\r]/g, '').replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '')
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(u)
  return !m || list.includes(m[1].toLowerCase())
}

const problems = (out, removed) => {
  const errs = []
  for (const scriptingEnabled of [true, false]) {
    const walk = (n) => {
      for (const c of n.childNodes ?? []) {
        if (!c.tagName) continue
        if (c.namespaceURI !== 'http://www.w3.org/1999/xhtml') errs.push('foreign element ' + c.tagName)
        if (!TAGS.has(c.tagName) || removed.includes(c.tagName)) errs.push('tag ' + c.tagName)
        for (const a of c.attrs) {
          if (a.name.startsWith('on')) errs.push('event attr ' + a.name)
          else if (!GLOBAL.has(a.name) && !(PER[c.tagName] ?? []).includes(a.name))
            errs.push('attr ' + c.tagName + '[' + a.name + ']')
          if (a.name === 'style') errs.push('style attr')
          if (URLS[a.name] && !urlOk(a.value, URLS[a.name])) errs.push('url ' + a.name + '=' + JSON.stringify(a.value))
          if (a.name === 'srcset' && /^\s*(javascript|data|vbscript):/i.test(a.value)) errs.push('srcset')
        }
        if (
          c.tagName === 'input' &&
          (c.attrs.find((a) => a.name === 'type')?.value !== 'checkbox' || !c.attrs.some((a) => a.name === 'disabled'))
        )
          errs.push('input not a disabled checkbox')
        walk(c)
      }
    }
    const tree = parseFragment(out, { scriptingEnabled })
    walk(tree)
    // Re-parse stability: what the browser builds must serialize back to a fixed point.
    const once = serialize(tree)
    if (serialize(parseFragment(once, { scriptingEnabled })) !== once) errs.push('reparse not stable')
  }
  // Strict balance, so server-rendered output cannot close its container.
  const stack = []
  for (const m of out.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g)) {
    const tag = m[2].toLowerCase()
    if (m[1]) {
      if (stack.pop() !== tag) {
        errs.push('unbalanced </' + tag + '>')
        break
      }
    } else if (!VOID.has(tag)) stack.push(tag)
  }
  if (stack.length) errs.push('unclosed ' + stack.join(','))
  // The tree the browser builds should be the tree the writer wrote (no restructuring).
  const tagsInOut = [...out.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1].toLowerCase())
  const tagsInTree = []
  const collect = (n) => {
    for (const c of n.childNodes ?? [])
      if (c.tagName) {
        tagsInTree.push(c.tagName)
        collect(c)
      }
  }
  collect(parseFragment(out))
  if (tagsInOut.join() !== tagsInTree.join())
    errs.push('restructured: ' + tagsInOut.join() + ' -> ' + tagsInTree.join())
  return errs
}

export const check = (md) => {
  const found = []
  for (const removed of [['img', 'picture'], []]) {
    let out
    try {
      out = htmlFromMarkdown(md, { removeTags: removed })
    } catch (e) {
      found.push({ md, err: 'threw ' + e.message })
      continue
    }
    const errs = problems(out, removed)
    if (errs.length) found.push({ md, out, errs: [...new Set(errs)] })
  }
  return found
}
