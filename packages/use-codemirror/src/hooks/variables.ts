import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view'

const variableHighlighterDecoration = new MatchDecorator({
  regexp: /(\{[^}]+\})/g,
  decoration: () =>
    Decoration.mark({
      attributes: {
        class: 'api-client-url-variable',
      },
    }),
})

export const variables = () =>
  ViewPlugin.fromClass(
    class {
      variables: DecorationSet
      constructor(view: EditorView) {
        this.variables = variableHighlighterDecoration.createDeco(view)
      }
      update(update: ViewUpdate) {
        this.variables = variableHighlighterDecoration.updateDeco(
          update,
          this.variables,
        )
      }
    },
    {
      decorations: (instance) => instance.variables,
      provide: (plugin) =>
        EditorView.atomicRanges.of(
          (view) => view.plugin(plugin)?.variables || Decoration.none,
        ),
    },
  )
