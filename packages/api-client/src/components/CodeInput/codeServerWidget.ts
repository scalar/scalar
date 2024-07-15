import { useWorkspace } from '@/store/workspace'
import { RangeSetBuilder } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { createApp, h } from 'vue'

import AddressBarServer from '../AddressBar/AddressBarServer.vue'

const { servers, activeCollection } = useWorkspace()

class ServerWidget extends WidgetType {
  private app: any

  constructor(private serverUid: string) {
    super()
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-server'

    const serverUrl = servers[this.serverUid]?.url
    span.textContent = serverUrl

    if (
      activeCollection.value?.spec.serverUids &&
      activeCollection.value.spec.serverUids.length > 1
    ) {
      this.app = createApp({
        render() {
          return h(AddressBarServer, { serverUid: this.serverUid })
        },
      })
      this.app.mount(span)
    }

    return span
  }

  destroy() {
    if (this.app) {
      this.app.unmount()
    }
  }

  eq(other: WidgetType) {
    return other instanceof ServerWidget && other.serverUid === this.serverUid
  }
}

export const serverPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    widgetRemoved: boolean = false

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        if (update.view.state.doc.length === 0) {
          this.decorations = Decoration.none
          this.widgetRemoved = true
        } else if (!this.widgetRemoved) {
          this.decorations = this.buildDecorations(update.view)
        }
      }
    }

    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>()
      const serverUid =
        activeCollection.value?.selectedServerUid ||
        activeCollection.value?.spec.serverUids?.[0] ||
        ''

      if (serverUid) {
        builder.add(
          0,
          0,
          Decoration.widget({
            widget: new ServerWidget(serverUid),
            side: 1,
          }),
        )
      }

      return builder.finish()
    }
  },
  {
    decorations: (v) => v.decorations,
  },
)
