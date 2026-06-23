import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

const XScalarLinkItemSchema = Type.Object({
  name: Type.String(),
  url: Type.String(),
})

export const XScalarLinksSchema = Type.Object({
  'x-scalar-links': Type.Optional(Type.Array(XScalarLinkItemSchema)),
})

const XScalarLinkItem = object(
  {
    name: string(),
    url: string(),
  },
  {
    typeName: 'XScalarLinkItem',
    typeComment: 'A named link to display alongside the API info',
  },
)

export type XScalarLinks = {
  /**
   * Additional named links to display alongside the API info, for example a privacy policy or an
   * imprint. This is handy for the legal texts that some countries require on public websites.
   */
  'x-scalar-links'?: {
    /** The label to display for the link. */
    name: string
    /** The URL the link points to. */
    url: string
  }[]
}

export const XScalarLinks = object(
  {
    'x-scalar-links': optional(
      array(XScalarLinkItem, {
        typeComment: 'Additional named links to display alongside the API info (e.g. privacy policy, imprint)',
      }),
    ),
  },
  {
    typeName: 'XScalarLinks',
    typeComment: 'Additional named links to display alongside the API info',
  },
)
