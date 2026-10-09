export const extensions = {
  document: {
    navigation: 'x-scalar-navigation',
    /**
     * Where a compact document's navigation children are, until they are loaded.
     *
     * Only a compact server workspace sets it, and `resolve(['x-scalar-navigation'])` removes it once
     * the children are on the document. Its presence is what "not loaded yet" means, so it has to
     * travel with the document: `exportWorkspace` carries it, and a store the workspace is loaded
     * into resolves from it.
     */
    navigationChunk: 'x-scalar-navigation-chunk',
  },
  workspace: {
    colorMode: 'x-scalar-color-mode',
    sidebarWidth: 'x-scalar-sidebar-width',
    defaultClient: 'x-scalar-default-client',
    defaultExample: 'x-scalar-default-example',
    activeDocument: 'x-scalar-active-document',
    theme: 'x-scalar-theme',
  },
} as const
