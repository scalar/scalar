import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'

import { type UseCodeMirrorParameters, editorLanguages, useCodeMirrorEditor } from './hooks/useCodeMirror'

export {
  EditorState,
  type Extension,
  RangeSetBuilder,
  StateEffect,
} from '@codemirror/state'
export {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'

export { colorPicker } from './extensions/color-picker/color-picker'
export type { UseCodeMirrorParameters } from './hooks/useCodeMirror'
export { useDropdown } from './hooks/useDropdown'
export type { CodeMirrorLanguage } from './types'

const languages = { ...editorLanguages, html, css }

/** Reactive CodeMirror integration with all built-in languages. */
export const useCodeMirror = (params: UseCodeMirrorParameters): ReturnType<typeof useCodeMirrorEditor> =>
  useCodeMirrorEditor(params, languages)
