import { z } from 'zod'

/**
 * Mirror of the `ReleaseNote` type used by the Scalar app's "What's new"
 * modal. Kept as a Zod schema so we can validate the AI-generated payload
 * before it ever leaves CI - a malformed entry would otherwise break the
 * bundled release-notes JSON consumed by the app.
 *
 * The schema is also the source for the auto-generated
 * `RELEASE_NOTES.schema.json` file next to each release JSON, so editors
 * can offer autocomplete and validation when someone edits a release
 * entry by hand on the release PR (for example to add a video clip or an
 * extra paragraph that the AI generator could not produce on its own).
 *
 * Keep this in sync with
 * `projects/scalar-app/src/features/whats-new/types.ts`.
 */

const versionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/, 'Expected a semver-like version string')
  .describe('Semver-style version string for the release (for example `3.5.1`).')

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO `YYYY-MM-DD` date')
  .describe('Release date in ISO `YYYY-MM-DD` format.')

const titleSchema = z.string().min(1).max(120).describe('Short, sentence-case headline summarizing the release.')

const descriptionSchema = z
  .string()
  .min(1)
  .max(500)
  .describe(
    'Optional one-paragraph summary rendered above any rich content. Mostly used by AI-generated entries; reach for `content` paragraphs when you need rich copy.',
  )

const highlightsSchema = z
  .array(z.string().min(1).max(280).describe('A single-sentence highlight rendered as a bullet point.'))
  .max(8)
  .describe(
    'Optional bullet list of single-sentence highlights, rendered above any rich content. Mostly used by AI-generated entries.',
  )

const hrefSchema = z.string().url().describe('Optional URL for the "Read full release notes" link. Opens in a new tab.')

const paragraphBlockSchema = z
  .object({
    type: z.literal('paragraph').describe('Discriminator for the paragraph block type.'),
    text: z
      .string()
      .min(1)
      .max(2000)
      .describe('Plain-text paragraph copy. Use multiple paragraph blocks for multi-paragraph notes.'),
  })
  .describe('A free-form paragraph rendered between other content blocks.')

const headingBlockSchema = z
  .object({
    type: z.literal('heading').describe('Discriminator for the heading block type.'),
    text: z.string().min(1).max(120).describe('Subsection heading shown inside the release entry.'),
    level: z
      .union([z.literal(3), z.literal(4)])
      .optional()
      .describe('Heading level. Defaults to 3 (rendered below the release title).'),
  })
  .describe('A subsection heading inside a release entry.')

const listBlockSchema = z
  .object({
    type: z.literal('list').describe('Discriminator for the list block type.'),
    items: z
      .array(z.string().min(1).max(280).describe('A single-sentence list item.'))
      .min(1)
      .max(20)
      .describe('Bullet items rendered as a list. Keep each item to a single sentence.'),
    ordered: z.boolean().optional().describe('Render as a numbered list when `true`. Defaults to a bullet list.'),
  })
  .describe('A bullet (or numbered) list of single-sentence items.')

const imageBlockSchema = z
  .object({
    type: z.literal('image').describe('Discriminator for the image block type.'),
    src: z.string().url().describe('Absolute URL of the image asset.'),
    alt: z.string().min(1).max(280).describe('Accessibility text. Required - describe what the image shows.'),
    caption: z.string().min(1).max(280).optional().describe('Optional caption rendered beneath the image.'),
    width: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Optional natural width of the image in pixels. Helps the layout reserve space before the image loads.',
      ),
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Optional natural height of the image in pixels. Helps the layout reserve space before the image loads.',
      ),
  })
  .describe('An inline image. Provide alt text for accessibility and an optional caption rendered beneath.')

const videoBlockSchema = z
  .object({
    type: z.literal('video').describe('Discriminator for the video block type.'),
    src: z.string().url().describe('Absolute URL of an MP4/WebM video asset (self-hosted works best).'),
    poster: z
      .string()
      .url()
      .optional()
      .describe('Optional URL of a poster image shown before the video starts playing.'),
    caption: z.string().min(1).max(280).optional().describe('Optional caption rendered beneath the video.'),
    autoplay: z
      .boolean()
      .optional()
      .describe('When `true`, the video starts playing as soon as it is rendered. Pair with `muted: true`.'),
    loop: z.boolean().optional().describe('When `true`, the video loops back to the start when it ends.'),
    muted: z
      .boolean()
      .optional()
      .describe('When `true`, the video is muted. Required for autoplay to work in modern browsers.'),
    controls: z
      .boolean()
      .optional()
      .describe('When `true`, native playback controls are shown. Defaults to `true` when omitted.'),
  })
  .describe('An inline video clip. Self-hosted MP4/WebM URLs work best - autoplay clips should also set `muted: true`.')

/**
 * One rich content block rendered inside a release note. The
 * discriminator (`type`) is the same field every block uses so the
 * generated JSON schema produces clean autocomplete in editors.
 */
export const contentBlockSchema = z
  .discriminatedUnion('type', [
    paragraphBlockSchema,
    headingBlockSchema,
    listBlockSchema,
    imageBlockSchema,
    videoBlockSchema,
  ])
  .describe('Rich content block rendered inside a release note (paragraph, heading, list, image, or video).')

export const releaseNoteSchema = z
  .object({
    version: versionSchema,
    date: dateSchema,
    title: titleSchema,
    description: descriptionSchema.optional(),
    highlights: highlightsSchema.optional(),
    content: z
      .array(contentBlockSchema)
      .max(40)
      .optional()
      .describe(
        'Optional ordered list of rich content blocks. Use this to add multi-paragraph copy, screenshots, or demo videos that the simple `description`/`highlights` fields cannot express.',
      ),
    href: hrefSchema.optional(),
  })
  .describe('A single curated release note rendered in the "What\'s new" modal.')

/**
 * Schema for the on-disk `RELEASE_NOTES.json` array. Exposed separately
 * from the per-entry schema so the generated JSON Schema file describes
 * the file root (an array) rather than a single entry.
 */
export const releaseNotesFileSchema = z
  .array(releaseNoteSchema)
  .describe('Curated, user-facing release notes for the Scalar app. Newest entry first.')

export type ContentBlock = z.infer<typeof contentBlockSchema>
export type ReleaseNote = z.infer<typeof releaseNoteSchema>
