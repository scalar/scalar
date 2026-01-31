# Themes

The `theme` property sets the visual appearance of your documentation site. Scalar provides a collection of built-in themes to match your brand or style preferences.

## Configuration

Set the theme in the `siteConfig` object of your `scalar.config.json` file:

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "theme": "purple"
  }
}
```

## Available Themes

| Theme        | Description                         |
| ------------ | ----------------------------------- |
| `default`    | The default theme                   |
| `alternate`  | An alternative light/dark theme     |
| `moon`       | A softer, moon-inspired palette     |
| `purple`     | Purple accent colors                |
| `solarized`  | Based on the Solarized color scheme |
| `bluePlanet` | Blue tones with a planetary feel    |
| `deepSpace`  | Dark theme with deep space colors   |
| `saturn`     | Warm, Saturn-inspired tones         |
| `kepler`     | A cosmic, Kepler-inspired theme     |
| `mars`       | Red and warm Mars-inspired colors   |
| `laserwave`  | Retro synthwave-inspired colors     |

To apply no theme at all (feeling dangerous, eh?), pass `none`:

```json
// scalar.config.json
{
  "siteConfig": {
    "theme": "none"
  }
}
```
