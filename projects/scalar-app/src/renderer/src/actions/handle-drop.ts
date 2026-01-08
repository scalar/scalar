import type { ClientActionHandler } from './types'

export const handleDrop: ClientActionHandler = ({ store }) => {
  // Drag and drop
  document.addEventListener('drop', drop)
  document.addEventListener('dragover', dragover)

  function drop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Check if the user dropped an URL
    if (e.dataTransfer?.getData('text/uri-list')) {
      const url = e.dataTransfer.getData('text/uri-list')
      const appOrigin = window.location.origin

      // Prevents self importation that is causing collection creation
      if (url.startsWith(appOrigin)) {
        return
      }

      if (url) {
        store.addDocument({ url, name: 'Untitled' })
      }

      return
    }

    // Check if the user dropped a file
    for (const f of e.dataTransfer?.files ?? []) {
      console.log(f)
      // const fileContent = await window.api.readFile(f.path)

      // if (fileContent) {
      //   // client.store.importSpecFile(fileContent, 'default')
      //   console.log(fileContent.slice(0, 100))
      // }
    }
  }

  function dragover(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  // Your implementation here
}
