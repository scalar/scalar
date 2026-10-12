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

Docs sites support these built-in themes: `default`, `alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `deepSpace`, `saturn`, `kepler`, `mars`, `laserwave`, `elysiajs`, and `fastify`. The names `blue-planet`, `deep-space`, and `kepler-11e` work too.

You can also set `theme` to:

- the path to a `.css` file in your project, like `"./theme.css"`
- the slug of one of your team's custom themes

Your documentation site and your API references share the same theme system. To see what each theme looks like, and to customize colors, fonts, and layouts with CSS variables, see the [Themes reference](../../../themes.md).
