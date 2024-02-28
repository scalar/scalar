export default function (context, options) {
  return {
    name: 'scalar-docusaurus',

    async loadContent() {
      // Optionally, load your OpenAPI spec from a file or an external source here
    },

    async contentLoaded({ content, actions }) {
      const { addRoute, createData } = actions

      // Assuming `content` is your OpenAPI spec; you might have loaded it above
      // Create a JSON file in .docusaurus that contains your OpenAPI spec
      console.log(content)
      const openApiSpecPath = await createData(
        'openapi-spec.json',
        JSON.stringify(content || {}),
      )

      // Add a route for your OpenAPI spec viewer page
      addRoute({
        path: '/api-docs',
        component: '@site/src/Scalar', // You will create this React component
        // Provide the path to the loaded spec as a prop to your component
        exact: true,
        modules: {
          openApiSpec: openApiSpecPath,
        },
      })
    },

    // Implement other plugin lifecycle APIs if needed
  }
}
