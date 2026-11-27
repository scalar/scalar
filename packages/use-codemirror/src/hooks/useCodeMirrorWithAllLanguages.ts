import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'

import { type UseCodeMirrorParameters, editorLanguages, useCodeMirrorEditor } from './useCodeMirror'

export type { UseCodeMirrorParameters } from './useCodeMirror'

const languages = { ...editorLanguages, html, css }

/** Reactive CodeMirror integration with all built-in languages. */
export const useCodeMirror = (params: UseCodeMirrorParameters): ReturnType<typeof useCodeMirrorEditor> =>
  useCodeMirrorEditor(params, languages)
