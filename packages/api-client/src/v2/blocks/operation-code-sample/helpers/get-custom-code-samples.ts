import type {
  XCodeSample,
  XLanguageExample,
  XReadmeCodeSample,
} from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Turns a `{ language: source }` map (x-stainless-snippets) into code samples. */
const fromSnippetMap = (snippets: Record<string, string> | undefined, label?: string): XCodeSample[] =>
  Object.entries(snippets ?? {}).map(([lang, source]) => ({ lang, source, ...(label ? { label } : {}) }))

/**
 * Turns `x-stainless-examples` / `x-scalar-examples` into code samples.
 *
 * Each example carries per-language request snippets and an optional title that
 * we surface as the picker label. The response is only used for documentation,
 * so it is ignored here.
 */
const fromLanguageExamples = (examples: XLanguageExample | XLanguageExample[] | undefined): XCodeSample[] => {
  if (!examples) {
    return []
  }

  return (Array.isArray(examples) ? examples : [examples]).flatMap((example) =>
    fromSnippetMap(example.request, example.title),
  )
}

/** Turns ReadMe's `x-readme.code-samples` into code samples. */
const fromReadmeSamples = (samples: XReadmeCodeSample[] | undefined): XCodeSample[] =>
  (samples ?? []).map((sample) => ({
    lang: sample.language,
    source: sample.code,
    ...(sample.name ? { label: sample.name } : {}),
  }))

/**
 * Grabs any custom code samples from the operation.
 *
 * Several tools write code samples into OpenAPI under different extensions. When
 * more than one is present we use the highest-priority source only, rather than
 * showing duplicates from every tool. Priority, highest first:
 *
 * 1. `x-scalar-examples`
 * 2. `x-stainless-snippets` (overrides `x-stainless-examples`)
 * 3. `x-stainless-examples`
 * 4. `x-readme.code-samples`
 * 5. `x-codeSamples` / `x-code-samples` / `x-custom-examples`
 *
 * @param operation - The operation to get the custom code samples from
 * @returns An array of custom code samples which exist in the operation
 */
export const getCustomCodeSamples = (operation: OperationObject): XCodeSample[] => {
  const scalarExamples = operation['x-scalar-examples'] ?? []
  if (scalarExamples.length) {
    return scalarExamples
  }

  const stainlessSnippets = fromSnippetMap(operation['x-stainless-snippets'])
  if (stainlessSnippets.length) {
    return stainlessSnippets
  }

  const stainlessExamples = fromLanguageExamples(operation['x-stainless-examples'])
  if (stainlessExamples.length) {
    return stainlessExamples
  }

  const readmeSamples = fromReadmeSamples(operation['x-readme']?.['code-samples'])
  if (readmeSamples.length) {
    return readmeSamples
  }

  const customCodeKeys = ['x-custom-examples', 'x-codeSamples', 'x-code-samples'] as const
  return customCodeKeys.flatMap((key) => operation[key] ?? [])
}
