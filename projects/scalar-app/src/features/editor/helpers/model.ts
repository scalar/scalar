import type * as monaco from 'monaco-editor'

type MaybePromise<T> = T | Promise<T>

export type Path = readonly (string | number)[]

export type EditorModel = {
  model: monaco.editor.ITextModel
  getRangeFromPath: (path: Path) => MaybePromise<monaco.Range | null>
}
