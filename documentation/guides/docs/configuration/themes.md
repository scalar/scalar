# Themes

The `theme` property sets the visual appearance of your documentation site. Scalar provides a collection of built-in themes to match your brand or style preferences.

## Configuration

Set the theme in the `siteConfig` object of your `scalar.config.json` file:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "theme": "purple"
  }
}
```

## Available Themes

Your documentation site and your API references share the same theme system. For the full list of built-in themes, how to disable theming with `none`, and how to customize colors, fonts, and layouts with CSS variables, see the [Themes reference](../../../themes.md).
