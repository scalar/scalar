import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'

class PlaceholderWidget extends WidgetType {
  name: string
  constructor(name: string) {
    super()
    this.name = name
  }
  eq(other: WidgetType & { name: string }) {
    return this.name == other.name
  }
  toDOM() {
    const element = document.createElement('span')
    element.className = `scalar-api-client__url-input__method`
    element.textContent = this.name

    return element
  }
  ignoreEvent() {
    return false
  }
}

const placeholderMatcher = new MatchDecorator({
  regexp: /(\{[^}]+\})/g,
  decoration: (match) =>
    Decoration.replace({
      widget: new PlaceholderWidget(match[1]),
    }),
})

export const placeholders = () =>
  ViewPlugin.fromClass(
    class {
      placeholders: DecorationSet
      constructor(view: EditorView) {
        this.placeholders = placeholderMatcher.createDeco(view)
      }
      update(update: ViewUpdate) {
        this.placeholders = placeholderMatcher.updateDeco(
          update,
          this.placeholders,
        )
      }
    },
    {
      decorations: (instance) => instance.placeholders,
      provide: (plugin) =>
        EditorView.atomicRanges.of(
          (view) => view.plugin(plugin)?.placeholders || Decoration.none,
        ),
    },
  )
