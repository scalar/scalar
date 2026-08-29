import { type ThemeId, getThemeStyles, themeIds, themeLabels } from '@scalar/themes'

/** Id of the style element the theme decorator owns, so it can replace rather than stack styles. */
const STYLE_ELEMENT_ID = 'scalar-storybook-theme'

/** A theme is a stylesheet, so a variant is either some CSS to apply or nothing at all. */
type ThemeVariant = {
  /** Label shown in the Storybook toolbar. */
  label: string
  /** CSS to inject, or null to render the theme the stories already ship with. */
  css: string | null
}

/**
 * The theme presets, keyed by id.
 *
 * `default` injects nothing: it is the theme already loaded by `preview.ts`, so leaving it alone
 * keeps the stories rendering exactly as they would without this decorator.
 *
 * `none` is dropped because `getThemeStyles` resolves it back to the default preset anyway.
 */
const presetVariants = themeIds
  .filter((id): id is Exclude<ThemeId, 'none'> => id !== 'none')
  .reduce(
    (variants, id) => {
      variants[id] = {
        label: themeLabels[id],
        css: id === 'default' ? null : getThemeStyles(id, { fonts: false }),
      }
      return variants
    },
    {} as Record<Exclude<ThemeId, 'none'>, ThemeVariant>,
  )

/**
 * Radius variants, expressed as themes.
 *
 * The whole radius scale derives from `--scalar-radius`, so overriding that one variable is enough
 * to rescale every corner. It has to be set on `:root`: a custom property substitutes `var()` at the
 * element where it is declared, and the derived tokens are declared there, so an override further
 * down the tree would move the base without moving anything derived from it.
 *
 * They are named after the Tailwind classes whose look they force on the whole interface, since
 * `rounded-none` flattens every corner and `rounded-full` caps every one of them into a pill.
 *
 * None of the presets reach these extremes. Only Laserwave touches radius at all, and it pins its
 * own larger radii rather than deriving them.
 */
const radiusVariants = {
  'rounded-none': {
    label: 'Rounded None (0)',
    css: '@layer scalar-theme { :root { --scalar-radius: 0px; } }',
  },
  'rounded-full': {
    label: 'Rounded Full (9999px)',
    css: '@layer scalar-theme { :root { --scalar-radius: 9999px; } }',
  },
} as const satisfies Record<string, ThemeVariant>

/** Every theme a story can be rendered under, whether from the toolbar or from a visual test. */
export const themeVariants = {
  ...presetVariants,
  ...radiusVariants,
}

export type ThemeVariantId = keyof typeof themeVariants

/** The theme stories render under unless a story or a test asks for another one. */
export const defaultThemeVariant: ThemeVariantId = 'default'

/**
 * Applies a theme variant to the document.
 *
 * The preset CSS arrives wrapped in `@layer scalar-theme`, which outranks the `scalar-base` layer
 * the default preset is loaded into, so it wins on layer order rather than specificity. This is the
 * same mechanism the api reference uses to apply a theme at runtime.
 */
export const applyThemeVariant = (id: ThemeVariantId) => {
  document.getElementById(STYLE_ELEMENT_ID)?.remove()

  const css = themeVariants[id]?.css
  if (!css) {
    return
  }

  const style = document.createElement('style')
  style.id = STYLE_ELEMENT_ID
  style.textContent = css
  document.head.append(style)
}
