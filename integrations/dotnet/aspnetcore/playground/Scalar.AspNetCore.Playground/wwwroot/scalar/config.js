export default {
  generateOperationSlug: (operation) => `awesome-${operation.method.toLowerCase()}${operation.path}`,
  onDocumentSelect: () => console.log('Document changed'),
}
