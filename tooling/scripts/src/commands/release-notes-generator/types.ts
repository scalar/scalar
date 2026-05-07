import { z } from 'zod'

/**
 * Mirror of the `ReleaseNote` type used by the Scalar app's "What's new"
 * modal. Kept as a Zod schema so we can validate the AI-generated payload
 * before it ever leaves CI - a malformed entry would otherwise break the
 * bundled release-notes JSON consumed by the app.
 *
 * Keep this in sync with
 * `projects/scalar-app/src/features/whats-new/types.ts`.
 */
export const releaseNoteSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/, 'Expected a semver-like version string'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO `YYYY-MM-DD` date'),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500).optional(),
  highlights: z.array(z.string().min(1).max(280)).max(8).optional(),
  href: z.string().url().optional(),
})

export type ReleaseNote = z.infer<typeof releaseNoteSchema>
