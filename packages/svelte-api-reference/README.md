# Scalar Svelte API Reference

[![Version](https://img.shields.io/npm/v/%40scalar/svelte-api-reference)](https://www.npmjs.com/package/@scalar/svelte-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/svelte-api-reference)](https://www.npmjs.com/package/@scalar/svelte-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fsvelte-api-reference)](https://www.npmjs.com/package/@scalar/svelte-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Svelte.

## Installation

To install the `ApiReference` component, run the following command in your Svelte project:

```bash
npm install @scalar/svelte-api-reference
```

## Usage

If you have a OpenAPI/Swagger file already, you can pass a URL to the plugin in an API Route:

```svelte
// src/routes/+page.svelte
<script>
<script>
import ApiReference from 'svelte-api-reference'

const config = {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
}
</script>

<ApiReference configuration={config} />
```

## Configuration

You can pass additional props to customize the behavior and appearance of the API reference component:

```svelte
const config = {
  theme: "dark",
  showTryItOut: true,
  enableSearch: true
}
```

### Available Props

- `spec`: path/URL to the OpenAPI specification.
- `theme`: Theme for the API documentation (`default`, `dark`, etc.).
- `showTryItOut`: Enables interactive "Try it out" features.
- `enableSearch`: Enables a search box to quickly find API endpoints.

## Themes

By default, we’re using a custom Svelte theme and it’s beautiful. But you can choose one of our other themes, too:

```svelte
const config = {
  theme: "alternate"
}
```

## Contributing

Contributions are always welcome! Please read the [contributing guide](https://github.com/scalar/scalar/blob/main/CONTRIBUTING.md) to learn how you can help.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
