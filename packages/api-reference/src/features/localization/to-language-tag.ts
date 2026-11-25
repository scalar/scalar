/**
 * The configured locale as a value for the `lang` attribute. Underscores become hyphens, so values
 * like `es_MX` become valid BCP 47 language tags (`es-MX`).
 *
 * The reference root and anything it renders in a portal outside itself (which cannot inherit the
 * root's `lang`) both use this, so the two always agree.
 */
export const toLanguageTag = (locale: string): string => locale.replace('_', '-')
