/**
 * Keep CSS inside an HTML style element when serializing a document.
 * HTML parses closing tags even inside CSS strings and comments. Escaping the
 * slash preserves CSS string values without introducing HTML entities into CSS.
 */
export const escapeCssForStyleTag = (css: string): string => css.replace(/<\/(style)/gi, '<\\/$1')
