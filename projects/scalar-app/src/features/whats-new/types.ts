/**
 * Curated release note shown in the "What's new" modal.
 *
 * These are hand-written, user-facing entries (Linear / Vercel style) rather
 * than the raw `CHANGELOG.md` output. The auto-generated changelog is too
 * noisy for end users (commit titles like `chore: use homemade slugger`),
 * so we maintain a small parallel list with a friendly tone, grouped per
 * release.
 *
 * The on-disk shape is mirrored as `releaseNoteSchema` in
 * `tooling/scripts/src/commands/release-notes-generator/types.ts`. The
 * generator validates model JSON against a smaller `aiReleaseNoteSchema`
 * first, then `buildReleaseNoteFromAiOutput` maps into this shape;
 * `RELEASE_NOTES.schema.json` describes the full entry type for manual edits.
 * Keep both TS types and `releaseNoteSchema` in sync.
 */

/**
 * One block in the release body (`content`). Use `paragraph` for intro
 * copy, `list` for bullet highlights, headings/images/videos for richer
 * notes, and `href` blocks for outbound CTAs (for example full release notes).
 */
export type ContentBlock = ParagraphBlock | HeadingBlock | ListBlock | ImageBlock | VideoBlock | HrefBlock

/** Free-form paragraph of plain text. Use one block per paragraph. */
export type ParagraphBlock = {
  type: 'paragraph'
  /** Plain-text paragraph copy. */
  text: string
}

/** Subsection heading inside a release entry. */
export type HeadingBlock = {
  type: 'heading'
  /** Heading text. */
  text: string
  /**
   * Heading level. Defaults to 3 (rendered below the release title).
   * Level 4 reads as a smaller subheading inside the entry.
   */
  level?: 3 | 4
}

/** Bullet (or numbered) list of single-sentence items. */
export type ListBlock = {
  type: 'list'
  /** Bullet items, kept to a single sentence each. */
  items: string[]
  /** Render as a numbered list when `true`. Defaults to a bullet list. */
  ordered?: boolean
}

/**
 * Inline image. `alt` is required - rich content shows up in the
 * "What's new" modal, so the same accessibility expectations apply
 * as the rest of the app.
 */
export type ImageBlock = {
  type: 'image'
  /** Absolute URL of the image asset. */
  src: string
  /** Accessibility text. Describe what the image shows. */
  alt: string
  /** Optional caption rendered beneath the image. */
  caption?: string
  /** Optional natural width in pixels. Lets the layout reserve space before the image loads. */
  width?: number
  /** Optional natural height in pixels. Lets the layout reserve space before the image loads. */
  height?: number
}

/**
 * Inline video clip. Self-hosted MP4/WebM URLs work best because they
 * play directly in `<video>` without a third-party embed. Autoplay only
 * works when the clip is also muted, per browser policy.
 */
export type VideoBlock = {
  type: 'video'
  /** Absolute URL of the video asset. */
  src: string
  /** Optional URL of a poster image shown before playback starts. */
  poster?: string
  /** Optional caption rendered beneath the video. */
  caption?: string
  /** Auto-start playback when the modal renders the entry. Requires `muted`. */
  autoplay?: boolean
  /** Loop the clip back to the start when it ends. */
  loop?: boolean
  /** Mute the audio track. Required for `autoplay` to work in modern browsers. */
  muted?: boolean
  /** Show native playback controls. Defaults to `true` when omitted. */
  controls?: boolean
}

/** Outbound URL opened in a new tab (for example GitHub release or changelog). */
export type HrefBlock = {
  type: 'href'
  href: string
  label: string
}

export type ReleaseNote = {
  /**
   * Semantic version of the release this entry describes (e.g. `3.5.1`).
   * Also used as the stable identity for "have I seen this entry yet?"
   * tracking in localStorage.
   */
  version: string
  /**
   * Release date as an ISO `YYYY-MM-DD` string. Rendered as a localized,
   * human-readable date in the modal.
   */
  date: string
  /** Short, sentence-case headline summarizing the release. */
  title: string
  /**
   * Optional body: paragraphs, bullet lists, subheadings, images, videos,
   * and `href` blocks. Put summary copy in `paragraph` blocks, highlights in
   * a `list` block, and full-release URLs in `{ type: 'href', href, label }`.
   */
  content?: ContentBlock[]
}
