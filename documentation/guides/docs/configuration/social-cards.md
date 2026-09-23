# Social Cards

Every page of your docs site gets a social card: the 1200 × 630 image shown when a link is shared on Slack, X, LinkedIn, iMessage, Discord and anywhere else that reads Open Graph tags. Scalar draws a card from your theme, logo and page title by default. A social card template replaces that design with your own.

A template is a TSX or JSX file in your repository. It runs once per page when the site builds, and its output is saved as a PNG.

## Set Up a Template

In the Scalar dashboard, open **Settings → Appearance → Social card** and choose **Customize**. That writes a starter template to `og/card.tsx`, configures it and opens it in the editor next to a live preview.

To set it up by hand, point `siteConfig.og.imageTemplate` at the file. The path is relative to `scalar.config.json`.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "og": {
      "imageTemplate": "./og/card.tsx"
    }
  }
}
```

To go back to the built-in card, remove the `og` block. Your template file stays in the repository.

An `og:image` set in `siteConfig.head.meta` replaces generated cards on every page, including ones from a template.

## Write a Template

A template default-exports a function. It receives the page's details as props and returns the card as JSX.

```tsx
// og/card.tsx
type Props = {
  title: string
  description?: string
  breadcrumb?: string
  path: string
  colors: Record<
    | 'color1'
    | 'color2'
    | 'color3'
    | 'bg1'
    | 'bg2'
    | 'bg3'
    | 'accent'
    | 'bgAccent'
    | 'border',
    string
  >
  logo: string | null
  mode: 'light' | 'dark'
}

export default function SocialCard({ title, description, colors }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
        padding: 80,
        backgroundColor: colors.bg1,
        fontFamily: 'Inter',
      }}>
      <div style={{ color: colors.color1, fontSize: 64, fontWeight: 700 }}>
        {title}
      </div>
      {description ? (
        <div style={{ color: colors.color2, fontSize: 28, marginTop: 20 }}>
          {description}
        </div>
      ) : null}
    </div>
  )
}
```

The function has to be pure: it returns markup and nothing else. Hooks, state, effects and data fetching aren't available.

The build compiles the template without typechecking it, so the `Props` type above is for your own editor. In the Scalar editor you can drop it — `OgTemplateProps`, `OgCss`, `OgColors` and `OgMode` are declared there already, with no import.

## Props

| Prop          | Type                | Description                                                                              |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| `title`       | `string`            | The page title.                                                                          |
| `description` | `string?`           | The page description, when it has one.                                                   |
| `breadcrumb`  | `string?`           | The section the page belongs to, as shown above the title on the built-in card.          |
| `path`        | `string`            | The page's route, such as `/guides/authentication`.                                      |
| `colors`      | `OgColors`          | Colours from your theme. See [Colors](#colors).                                          |
| `logo`        | `string \| null`    | Your site logo as a data URI, or `null` when there isn't one. Use it as an `img` source. |
| `mode`        | `'light' \| 'dark'` | The colour scheme the card is drawn in.                                                  |

Text arrives in full. Nothing is shortened for you, so long titles and descriptions need a line limit. See [Text](#text).

### Colors

Card colours come from your theme's CSS variables, for the colour scheme in `siteConfig.colorScheme.default`. The card is dark unless that is `light`.

| Color      | Theme variable               |
| ---------- | ---------------------------- |
| `color1`   | `--scalar-color-1`           |
| `color2`   | `--scalar-color-2`           |
| `color3`   | `--scalar-color-3`           |
| `bg1`      | `--scalar-background-1`      |
| `bg2`      | `--scalar-background-2`      |
| `bg3`      | `--scalar-background-3`      |
| `accent`   | `--scalar-color-accent`      |
| `bgAccent` | `--scalar-background-accent` |
| `border`   | `--scalar-border-color`      |

A variable your theme doesn't set falls back to the default Scalar theme.

## Layout and CSS

Cards are drawn by [Satori](https://github.com/vercel/satori), which turns JSX and inline styles into an image. Satori isn't a browser, and it supports [a subset of CSS](https://github.com/vercel/satori#css).

- **Layout is flexbox.** There is no grid, no floats and no `z-index`. An element with more than one child needs `display: 'flex'`.
- **Some values fail the card.** `display` accepts `flex`, `block`, `contents`, `none` and `-webkit-box`. `position` accepts `relative`, `absolute` and `static`. `overflow` accepts `visible` and `hidden`. Any other value for these stops that page's card from rendering.
- **Unsupported properties do nothing.** Properties Satori doesn't implement, such as `float`, `gridTemplateColumns` or `cursor`, are ignored without an error. `calc()` and `zIndex` log a warning and are ignored too.
- **Styles are inline.** Use the `style` prop. There are no class names or stylesheets.

In the Scalar editor, typing a style object as `OgCss` catches unsupported properties while you write:

```tsx
const card: OgCss = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
}
```

## Text

- **Limit lines** with `display: 'block'` and `lineClamp`. Text past the limit ends in an ellipsis. `lineClamp` does nothing on a flex element.
- **Break long words** with `wordBreak: 'break-word'`. Without it, one long token like a package name stays on a single line and runs off the card.
- **Let text columns shrink.** A column of text next to something else, like a logo, needs `flexShrink: 1` to give way. `minWidth: 0` doesn't stop it overflowing the card.

```tsx
<div
  style={{
    display: 'block',
    lineClamp: 2,
    fontSize: 64,
    wordBreak: 'break-word',
  }}>
  {title}
</div>
```

## Fonts

Inter is loaded at weights 400 and 700. Set `fontFamily: 'Inter'` on the card. Any other family falls back to Inter.

Pages with non-Latin text, such as Chinese, Japanese, Korean, Arabic or Hebrew, get matching Noto fonts added automatically when the site builds. The editor preview only has Inter, so non-Latin text can look different there. Emoji aren't supported and draw as an empty box.

## Images

Use the `logo` prop for your logo:

```tsx
<div style={{ display: 'flex', height: 64 }}>
  {logo ? (
    <img
      alt=""
      src={logo}
      style={{ height: 52 }}
    />
  ) : null}
</div>
```

## Imports

A template can import other files inside your project — a shared colour, a helper sitting next to it — and those are bundled when the site builds.

Packages are not available. Importing an npm package, or a Node builtin like `node:fs`, fails the build and names the import; the editor preview shows the same error in place of the card. A card draws an image, so inline whatever it needs.

## When Something Goes Wrong

- **A template that throws**, or returns an invalid style value, skips the card for that page. The build log names your template file and the error once, and the page is published without an `og:image` tag.
- **A template file that is missing or doesn't compile** fails the build.
- **A card that takes more than 20 seconds** to render is skipped.

## Preview in the Editor

When the configured template is open in the Scalar editor, the preview pane draws the card as you type, using your theme and a page from your site. It also shows how the link looks on Slack, LinkedIn, iMessage and Discord.

The preview renders in the browser. Layout and colours match the published card, but the final PNG is produced when the site builds.

## Learn More

- [Satori's supported CSS](https://github.com/vercel/satori#css)
- [Satori playground](https://og-playground.vercel.app), for trying out layouts
- [The Open Graph protocol](https://ogp.me)
