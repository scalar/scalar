/**
 * The highlight.js classes `code.css` gives a colour to, plus the few it
 * deliberately leaves alone.
 *
 * A sample only exercises the classes its own code needs, so checking emitted
 * classes against one reference render would reject a perfectly good class that
 * happens not to appear in that snippet. This is the vocabulary side of the
 * check: anything we emit has to be in here, or a token has quietly lost its
 * colour.
 *
 * Shared by the string renderer's tests and the hast renderer's, so the two
 * cannot drift into disagreeing about what counts as styled.
 */
export const STYLED_CLASSES: ReadonlySet<string> = new Set([
  'hljs-comment',
  'hljs-quote',
  'hljs-number',
  'hljs-regexp',
  'hljs-string',
  'hljs-built_in',
  'hljs-title class_',
  'hljs-keyword',
  'hljs-title function_',
  'hljs-subst',
  'hljs-name',
  'hljs-attr',
  'hljs-attribute',
  'hljs-addition',
  'hljs-literal',
  'hljs-selector-tag',
  'hljs-type',
  'hljs-selector-attr',
  'hljs-selector-pseudo',
  'hljs-doctag',
  'hljs-section',
  'hljs-title',
  'hljs-selector-id',
  'hljs-template-variable',
  'hljs-variable',
  'hljs-strong',
  'hljs-bullet',
  'hljs-link',
  'hljs-meta',
  'hljs-symbol',
  'hljs-deletion',
  'hljs-formula',
  'hljs-emphasis',
  // Emitted by highlight.js, unstyled by code.css — harmless either way.
  'hljs-punctuation',
  'hljs-params',
  'hljs-property',
])
