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
export { colorPicker } from '@replit/codemirror-css-color-picker'

export {
  type UseCodeMirrorParameters,
  useCodeMirror,
} from './hooks/useCodeMirror'
export { useDropdown } from './hooks/useDropdown'
export type { CodeMirrorLanguage } from './types'
