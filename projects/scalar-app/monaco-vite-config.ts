import type { DepOptimizationOptions } from 'vite'

/** TODO: Remove when monaco-yaml supports Monaco's post-0.56 worker protocol. */
export const monacoWorkerAliases = {
  'monaco-worker-manager/worker': 'monaco-editor/editor/editor.worker',
}

/** Keep web and Electron worker dependencies compatible during development. */
export const monacoOptimizeDeps = {
  exclude: ['monaco-editor', 'monaco-yaml', 'monaco-worker-manager/worker'],
  // The YAML worker imports this CommonJS dependency during development.
  include: ['monaco-yaml > path-browserify'],
} satisfies DepOptimizationOptions
