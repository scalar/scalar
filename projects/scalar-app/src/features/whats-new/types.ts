/**
 * Curated release note shown in the "What's new" modal.
 *
 * These are hand-written, user-facing entries (Linear / Vercel style) rather
 * than the raw `CHANGELOG.md` output. The auto-generated changelog is too
 * noisy for end users (commit titles like `chore: use homemade slugger`),
 * so we maintain a small parallel list with a friendly tone, grouped per
 * release.
 */
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
   * Optional one-paragraph summary. Use this to set context before the
   * `highlights` bullet list, or on its own when there is just one thing to
   * say.
   */
  description?: string
  /**
   * Optional list of bullet points highlighting the most user-facing
   * changes. Keep each item to a single sentence.
   */
  highlights?: string[]
  /**
   * Optional href for a "Read more" link, typically a GitHub release page
   * or a blog post. Opens in a new tab.
   */
  href?: string
}
