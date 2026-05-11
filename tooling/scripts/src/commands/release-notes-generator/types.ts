import { z } from 'zod'

/**
 * Release note shapes for the Scalar app's "What's new" modal.
 *
 * - **`aiReleaseNoteSchema`** — fixed contract for the Anthropic JSON
 *   response (`version`, `title`, `description`, `highlights` only). Do not
 *   add fields here without updating the model prompt. `buildReleaseNoteFromAiOutput`
 *   maps that payload into the stored shape (top-level `title` plus `content` blocks).
 * - **`releaseNoteSchema`** — on-disk shape: `version`, `date`, and `title`
 *   stay top-level; summary bullets and rich media live in optional `content`
 *   blocks (`paragraph`, `list`, `heading`, `image`, `video`, `href`). Use
 *   `{ type: 'href', href, label }` for outbound URLs (for example changelog or
 *   GitHub release). Source for
 *   `RELEASE_NOTES.schema.json`.
 *
 * Keep `releaseNoteSchema` in sync with
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

const highlightItemSchema = z
  .string()
  .min(1)
  .max(280)
  .describe('A single-sentence highlight rendered as a bullet point.')

/** Highlights in model output: same item rules as list blocks in `content`. */
const aiHighlightsSchema = z
  .array(highlightItemSchema)
  .max(5)
  .describe('Optional bullet list of single-sentence highlights (at most five items for generated notes).')

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

const hrefBlockSchema = z
  .object({
    type: z.literal('href').describe('Discriminator for an outbound URL block.'),
    href: z.string().url().describe('Destination URL (opened in a new tab).'),
    label: z.string().min(1).max(120).describe('Accessible link text (for example "Read full release notes").'),
  })
  .describe('Call-to-action link (for example to full release notes on GitHub).')

/**
 * One rich content block rendered inside a release note. The
 * discriminator (`type`) is the same field every block uses so the
 * generated JSON schema produces clean autocomplete in editors.
 */
const contentBlockSchema = z
  .discriminatedUnion('type', [
    paragraphBlockSchema,
    headingBlockSchema,
    listBlockSchema,
    imageBlockSchema,
    videoBlockSchema,
    hrefBlockSchema,
  ])
  .describe('Rich content block rendered inside a release note (paragraph, heading, list, image, video, or href).')

/**
 * JSON object returned by the release-notes model. Strict: unknown keys fail
 * validation so the contract stays stable and CI never merges stray fields.
 */
export const aiReleaseNoteSchema = z
  .object({
    version: versionSchema,
    title: titleSchema,
    description: descriptionSchema.optional(),
    highlights: aiHighlightsSchema.optional(),
  })
  .strict()
  .describe('Minimal AI-generated release note payload before merge with trusted metadata.')

type AiReleaseNote = z.infer<typeof aiReleaseNoteSchema>

export const releaseNoteSchema = z
  .object({
    version: versionSchema,
    date: dateSchema,
    title: titleSchema,
    content: z
      .array(contentBlockSchema)
      .max(40)
      .optional()
      .describe(
        'Body copy and rich blocks after the headline: `paragraph` for intro text, `list` for bullet highlights, then headings, media, and optional `href` blocks (for example full release notes).',
      ),
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

type ContentBlock = z.infer<typeof contentBlockSchema>
export type ReleaseNote = z.infer<typeof releaseNoteSchema>

/**
 * Build a stored `ReleaseNote` from validated AI fields: `title` stays
 * top-level; `description` and `highlights` become `paragraph` and `list`
 * blocks so the emitted JSON matches the hand-editable shape.
 */
export const buildReleaseNoteFromAiOutput = (
  ai: AiReleaseNote,
  trusted: { version: string; date: string; href: string },
): ReleaseNote => {
  const content: ContentBlock[] = []
  if (ai.description !== undefined) {
    content.push({ type: 'paragraph', text: ai.description })
  }
  if (ai.highlights !== undefined && ai.highlights.length > 0) {
    content.push({ type: 'list', items: [...ai.highlights], ordered: false })
  }
  content.push({
    type: 'href',
    href: trusted.href,
    label: 'Read full release notes',
  })
  return releaseNoteSchema.parse({
    version: trusted.version,
    date: trusted.date,
    title: ai.title,
    content,
  })
}
