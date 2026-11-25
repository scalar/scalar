import { HTTP_TOKEN } from '@scalar/helpers/http/http-token'
import { quoteHttpString } from '@scalar/helpers/http/quote-http-string'
import { isObject } from '@scalar/helpers/object/is-object'

/** Extended attributes use RFC 8187 syntax, including for UTF-8 titles. */
const encodeExtendedAttribute = (attribute: unknown): string | undefined => {
  if (!isObject(attribute) || typeof attribute.value !== 'string') {
    return undefined
  }
  const language = attribute.language ?? ''
  if (typeof language !== 'string' || /[^a-z0-9-]/i.test(language)) {
    return undefined
  }
  const text = encodeURIComponent(attribute.value).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  return `UTF-8'${language}'${text}`
}

const serializeTarget = (target: unknown, relation: string, anchor: string | undefined): string | undefined => {
  if (!isObject(target)) {
    return undefined
  }
  const { href, ...attributes } = target
  if (typeof href !== 'string' || /[^\x21-\x7e]|[<>"\\]/.test(href)) {
    return undefined
  }

  const parameters = [`rel=${quoteHttpString(relation)}`]
  if (anchor !== undefined) {
    parameters.push(`anchor=${quoteHttpString(anchor)}`)
  }
  for (const [name, attribute] of Object.entries(attributes)) {
    if (HTTP_TOKEN.exec(name)?.[0] !== name || ['rel', 'anchor'].includes(name.toLowerCase())) {
      return undefined
    }
    for (const item of Array.isArray(attribute) ? attribute : [attribute]) {
      const text = name.endsWith('*')
        ? encodeExtendedAttribute(item)
        : typeof item === 'string' && quoteHttpString(item)
      if (typeof text !== 'string') {
        return undefined
      }
      parameters.push(`${name}=${text}`)
    }
  }
  return `<${href}>; ${parameters.join('; ')}`
}

/** Render RFC 9264 link contexts in HTTP Link field syntax. */
const serializeContexts = (value: unknown): string | undefined => {
  if (!isObject(value) || !Array.isArray(value.linkset)) {
    return undefined
  }
  const links: string[] = []
  for (const context of value.linkset) {
    if (!isObject(context)) {
      return undefined
    }
    const { anchor, ...relations } = context
    if (anchor !== undefined && typeof anchor !== 'string') {
      return undefined
    }
    for (const [relation, targets] of Object.entries(relations)) {
      if (!Array.isArray(targets)) {
        return undefined
      }
      for (const target of targets) {
        const link = serializeTarget(target, relation, anchor)
        if (link === undefined) {
          return undefined
        }
        links.push(link)
      }
    }
  }
  return links.join(', ')
}

/** Standalone linkset documents allow line breaks that HTTP field values cannot carry. */
export const serializeLinkset = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.replace(/\r?\n/g, ' ') : serializeContexts(value)
  return text !== undefined && !/[^\t\x20-\x7e]/.test(text) ? text : undefined
}
