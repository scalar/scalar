import { cssNanoid } from '@lib/helpers/css-nanoid'

export const ApiReferenceClasses = {
  Base: `api-reference-base-${cssNanoid()}`,
  Endpoints: `api-reference-endpoints-${cssNanoid()}`,
  LanguageSelector: `api-reference-language-selector-${cssNanoid()}`,
  Tags: `scalar-api-client__overlay-tags-${cssNanoid()}`,
  CodeMenu: `scalar-api-client__overlay-codeMenu-${cssNanoid()}`,
}
