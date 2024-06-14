export { type Extension } from '@codemirror/state'
// @ts-expect-error y-codemirror is not exporting types correctly
export { yCollab } from 'y-codemirror.next'
export { colorPicker } from '@replit/codemirror-css-color-picker'

export { CodeMirror } from './components/CodeMirror'
export * from './hooks'
export * from './types'
