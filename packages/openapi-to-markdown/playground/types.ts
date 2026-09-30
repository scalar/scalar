import type { OpenApiRenderOptions } from '../src/select-document'

/** Selection values come from the loaded description, including paths without operation IDs. */
export type Page = { label: string; options: OpenApiRenderOptions }
/** Available pages and counts for the selected example. */
export type Manifest = { title: string; pages: Page[]; operations: number; models: number }
/** Exact Markdown, sanitized preview, and export measurements. */
export type ExportResult = { markdown: string; html: string; bytes: number; milliseconds: number }
