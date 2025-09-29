import { Type } from '@scalar/typebox'

export const MetaSchema = Type.Partial(
  Type.Object({
    title: Type.String(),
    description: Type.String(),
    ogTitle: Type.String(),
    ogDescription: Type.String(),
    ogImage: Type.String(),
    twitterCard: Type.String(),
  }),
)

export type Meta = {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: string
}

export const defaultMeta: Required<Meta> = {
  title: 'Scalar API Reference',
  description: 'Scalar API Reference',
  ogTitle: 'Scalar API Reference',
  ogDescription: 'Scalar API Reference',
  ogImage: 'https://scalar.com/images/scalar-logo.png',
  twitterCard: 'summary_large_image',
}
