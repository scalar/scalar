import { defaultFooter, defaultFooterCSS } from '@/project/footer'
import { type Guide, defaultGuide, guideSchema } from '@/project/guide'
import {
  type Reference,
  defaultReference,
  referenceSchema,
} from '@/project/reference'
import { nanoidSchema } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

// ---------------------------------------------------------------------------

export type HeaderLink = {
  uid: string
  title: string
  link: string
  show: boolean
  /** Option to display the link as a button */
  isButton: boolean
  /** Option to force a link into the header bar */
  isStarred: boolean
  /** For internal links we just use the guide or reference uid */
  type: 'guide' | 'reference' | 'link' | 'group'
  specPermalink?: string
  // For Groups :)
  children?: string[]
}

/**
 * Utility types for specific header item types
 */
export type HeaderLinkInternal = HeaderLink & { type: 'guide' | 'reference' }
export type HeaderLinkExternal = HeaderLink & { type: 'link' }
export type HeaderLinkGroup = HeaderLink & { type: 'group' }

export function isInternal(item: HeaderLink): item is HeaderLinkInternal {
  return ['guide', 'reference'].includes(item.type)
}
export function isExternal(item: HeaderLink): item is HeaderLinkExternal {
  return item.type === 'link'
}
export function isGroup(item: HeaderLink): item is HeaderLinkGroup {
  return item.type === 'group'
}

export const headerLinkSchema = z.object({
  uid: nanoidSchema,
  title: z.string(),
  link: z.string(),
  show: z.boolean().default(true),
  isButton: z.boolean().default(false),
  children: z.array(z.string()).optional(),
  isStarred: z.boolean().default(false),
  type: z
    .union([
      z.literal('guide'),
      z.literal('reference'),
      z.literal('link'),
      z.literal('group'),
    ])
    .default('link'),
}) satisfies ZodSchema<HeaderLink, ZodTypeDef, any>

// ---------------------------------------------------------------------------

export type Version = {
  uid: string
  /** Project the version is associated with */
  projectId: string
  name: string
  primaryGuideId: string
  primaryReferenceId: string
  references: Reference[]
  guides: Guide[]
  header: HeaderLink[]
  headerOrder: string[]
  footer: string
  footerCss: string
  footerBelowSidebar: boolean
  headScript: string
  bodyScript: string
}

export const versionSchema = z.preprocess(
  (arg: any) => {
    if (!arg) return arg
    // Remove legacy header links that are for guides and references
    if (Array.isArray(arg.header)) {
      arg.header = arg.header.filter(
        (h: any) =>
          h.uid && (h?.type === 'link' || h?.type === 'group' || !h?.type),
      )
    }

    if (!arg.headScript) arg.headScript = ''

    if (!arg.bodyScript) arg.bodyScript = ''

    return arg
  },
  z.object({
    uid: nanoidSchema,
    projectId: nanoidSchema,
    name: z.string().default('Default Version'),
    primaryGuideId: z.string(),
    primaryReferenceId: z.string(),
    references: referenceSchema.array(),
    guides: guideSchema.array(),
    header: headerLinkSchema.array(),
    headerOrder: z.string().array().default([]),
    footer: z.string().default(''),
    footerCss: z.string().default(''),
    footerBelowSidebar: z.boolean().default(false),
    headScript: z.string().default(''),
    bodyScript: z.string().default(''),
  }),
) satisfies ZodSchema<Version, ZodTypeDef, any>

export function defaultVersion(
  projectId: string,
  options: {
    hideGuide?: boolean
    hideReference?: boolean
  } = {},
) {
  const guide = defaultGuide()
  const reference = defaultReference()

  if (options.hideGuide) guide.show = false
  if (options.hideReference) reference.show = false

  return versionSchema.parse({
    uid: nanoid(),
    projectId,
    name: 'Version 0',
    primaryGuideId: guide.uid,
    primaryReferenceId: reference.uid,
    references: [reference],
    guides: [guide],
    header: [],
    footer: defaultFooter,
    footerCss: defaultFooterCSS,
    footerBelowSidebar: false,
    headScript: '',
    bodyScript: '',
  })
}

/** Create the complete list of header links for the guides and references */
export function getHeaderLinks(version: Version): HeaderLink[] {
  const guideLinks = version.guides.map(
    (g): HeaderLink => ({
      uid: g.uid,
      title: g.title,
      link: g.uid,
      show: g.show,
      isButton: g.isButton,
      isStarred: g.isStarred,
      type: 'guide',
    }),
  )

  const referenceLinks = version.references.map(
    (r): HeaderLink => ({
      uid: r.uid,
      title: r.title,
      link: r.uid,
      show: r.show,
      isButton: r.isButton,
      isStarred: r.isStarred,
      type: 'reference',
      specPermalink: r.specPermalink,
    }),
  )

  return [...version.header, ...guideLinks, ...referenceLinks]
}
