import { type Static, Type } from '@scalar/typebox'

export const FeaturesSchema = Type.Partial(
  Type.Object({
    showSidebar: Type.Boolean(),
    showModels: Type.Boolean(),
    showDownload: Type.Boolean(),
    showTestRequestButton: Type.Boolean(),
    showSearch: Type.Boolean(),
    showApiClientImport: Type.Boolean(),
    showDarkModeToggle: Type.Boolean(),
    expandAllTagSections: Type.Boolean(),
    persistAuthenticationState: Type.Boolean(),
  }),
)

export type Features = Static<typeof FeaturesSchema>

export const defaultFeatures: Required<Features> = {
  showSidebar: true,
  showModels: true,
  showDownload: true,
  showTestRequestButton: true,
  showSearch: true,
  showApiClientImport: true,
  showDarkModeToggle: true,
  expandAllTagSections: false,
  persistAuthenticationState: false,
}
