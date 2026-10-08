const prefix = 'Custom extension: '

/** Render the extension without importing a separate framework runtime. */
const CustomExtension = (/** @type {{ xCustomExtension: string }} */ props) => `${prefix}${props.xCustomExtension}`
CustomExtension.props = ['xCustomExtension']

/** The browser imports this module, so the component retains its local bindings. */
export default () => ({
  name: 'custom-extension',
  extensions: [{ name: 'x-custom-extension', component: CustomExtension }],
})
