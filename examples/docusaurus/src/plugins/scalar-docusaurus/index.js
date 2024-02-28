export default function (context, options) {
  return {
    name: 'scalar-docusaurus',

    async loadContent() {
      // Optionally, load your OpenAPI spec from a file or an external source here
    },

    async contentLoaded({ content, actions }) {
      const { addRoute, createData } = actions

      console.log(options, content, actions)

      // Assuming `content` is your OpenAPI spec; you might have loaded it above
      // Create a JSON file in .docusaurus that contains your OpenAPI spec

      options.specs.forEach(async (spec) => {
        const specProps = await createData(
          `scalarV1-${options.id || '1'}.json`,
          JSON.stringify(spec),
        )
        // Add a route for your OpenAPI spec viewer page
        addRoute({
          path: spec.route,
          component: '@site/src/ScalarDocu', // You will create this React component
          // Provide the path to the loaded spec as a prop to your component
          exact: true,
          modules: {
            specProps,
          },
        })
      })
    },

    // Implement other plugin lifecycle APIs if needed
  }
}
