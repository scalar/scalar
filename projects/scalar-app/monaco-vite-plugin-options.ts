import { join } from 'node:path'

import type monacoEditorPlugin from 'vite-plugin-monaco-editor-esm'

/**
 * Shared `vite-plugin-monaco-editor-esm` options for scalar-app web and Electron renderer builds.
 *
 * `customDistPath` avoids a broken nested output path when Vite uses absolute `root` / `outDir`
 * (see vite-plugin-monaco-editor-esm `writeBundle` path join logic).
 */
export const scalarAppMonacoEditorPluginOptions = {
  languageWorkers: ['json', 'editorWorkerService', 'typescript'],
  customWorkers: [
    {
      label: 'yaml',
      entry: 'monaco-yaml/yaml.worker',
    },
  ],
  customDistPath: (_root: string, outDir: string, _base: string) => join(outDir, 'monacoeditorwork'),
} satisfies NonNullable<Parameters<typeof monacoEditorPlugin>[0]>
