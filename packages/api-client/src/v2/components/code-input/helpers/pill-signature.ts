import { REGEX } from '@scalar/helpers/regex/regex-helpers'

/**
 * Build a structural signature for a model string.
 *
 * Two values produce the same signature iff their sequence of `{{name}}`
 * pills is identical. The editor uses this to skip a DOM rebuild for
 * plain-text edits that do not change the pill set, which preserves the
 * live caret and avoids any flicker.
 *
 * Returns an empty signature when pill rendering is disabled or the text
 * contains no pill markers — both cases share a single "no pills" bucket.
 */
export const pillSignature = (text: string, withVariables: boolean): string => {
  if (!withVariables || !text.includes('{{')) {
    return ''
  }
  const regex = new RegExp(REGEX.VARIABLES.source, REGEX.VARIABLES.flags)
  let signature = ''
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    signature += `|${match[1] ?? ''}`
  }
  return signature
}
