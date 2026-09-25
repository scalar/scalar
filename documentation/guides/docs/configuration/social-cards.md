# Social Cards

Every page of your docs site gets a social card: the 1200 × 630 image shown when a link is shared on Slack, X, LinkedIn, iMessage, Discord and anywhere else that reads Open Graph tags. Scalar draws one from your theme, logo and page title. A template replaces that design with your own — a TSX or JSX file in your repository, run once per page when the site builds.

## Setting up

In the [Scalar Dashboard](https://dashboard.scalar.com), open **Settings → Appearance → Social card** and choose **Customize**. That writes a starter template to `og/card.tsx`, configures it, and opens it in the editor next to a live preview.

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

Remove the `og` block to go back to the built-in card; your template file stays in the repository. An `og:image` set in [`siteConfig.head`](site-config.md#head) applies to every page and overrides generated cards, templates included.

## Writing a template

A template default-exports a pure function: it takes the page's details as props and returns the card as JSX. Hooks, state, effects and data fetching are not available.

```tsx
// og/card.tsx
export default function SocialCard({ title, description, colors }) {
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

In the Scalar editor, `OgTemplateProps`, `OgCss`, `OgColors` and `OgMode` are declared for you with no import. Elsewhere, declare the props yourself — the build compiles the template without typechecking it.

### Props

| Prop          | Type                | Description                                                                     |
| ------------- | ------------------- | ------------------------------------------------------------------------------- |
| `title`       | `string`            | The page title.                                                                 |
| `description` | `string?`           | The page description, when it has one.                                          |
| `breadcrumb`  | `string?`           | The section the page belongs to, as shown above the title on the built-in card. |
| `path`        | `string`            | The page's route, such as `/guides/authentication`.                             |
| `colors`      | `OgColors`          | Colors from your theme. See below.                                              |
| `logo`        | `string \| null`    | Your site logo as a data URI, or `null` when there isn't one.                    |
| `mode`        | `'light' \| 'dark'` | The color scheme the card is drawn in.                                          |

Text arrives in full. Nothing is shortened for you, so long titles and descriptions need a line limit.

### Colors

`colors` holds your theme's variables, resolved for the scheme in `siteConfig.colorScheme.default` — dark unless that is `light`. A variable your theme does not set falls back to the default Scalar theme.

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

## What Satori supports

Cards are drawn by [Satori](https://github.com/vercel/satori), which turns JSX and inline styles into an image. It is not a browser, and supports [a subset of CSS](https://github.com/vercel/satori#css).

- Layout is flexbox. There is no grid, no floats and no `z-index`, and an element with more than one child needs `display: 'flex'`.
- Styles are inline, through the `style` prop. There are no class names or stylesheets.
- `display`, `position` and `overflow` each accept a fixed set of values — `flex`, `block`, `contents`, `none`, `-webkit-box`; `relative`, `absolute`, `static`; `visible`, `hidden`. Anything else stops that page's card from rendering.
- Properties Satori does not implement, such as `float`, `gridTemplateColumns` or `cursor`, are ignored without an error. `calc()` and `zIndex` warn and are ignored too.

Typing a style object as `OgCss` catches unsupported properties while you write.

### Text

Clamp with `display: 'block'` and `lineClamp`, which does nothing on a flex element. Break long tokens with `wordBreak: 'break-word'`, or one package name runs off the card. A text column beside a logo needs `flexShrink: 1` to give way.

```tsx
<div style={{ display: 'block', lineClamp: 2, wordBreak: 'break-word' }}>
  {title}
</div>
```

### Fonts and images

Inter is loaded at weights 400 and 700, so set `fontFamily: 'Inter'` — any other family falls back to it. Pages with non-Latin text get matching Noto fonts added when the site builds; the editor preview only has Inter, so non-Latin text can look different there. Emoji are not supported and draw as an empty box.

Use the `logo` prop as an `img` source, and handle `null` for a site with no logo.

### Imports

A template can import other files inside your project — a shared color, a helper next to it — and those are bundled when the site builds. Packages are not available: an npm package, or a Node builtin like `node:fs`, fails the build and names the import. Inline whatever the card needs.

## When a card fails

- A template that throws, or returns an invalid style value, skips the card for that page. The build log names your file and the error once, and the page is published without an `og:image` tag.
- A template file that is missing or does not compile fails the build.
- A card that takes more than 20 seconds to render is skipped.

## Previewing in the editor

With the configured template open in the Scalar editor, the preview pane draws the card as you type, using your theme and a page from your site, and shows how the link looks on Slack, LinkedIn, iMessage and Discord. It renders in the browser — layout and colors match, but the final PNG is produced when the site builds.

## Learn more

- [Satori's supported CSS](https://github.com/vercel/satori#css)
- [Satori playground](https://og-playground.vercel.app), for trying out layouts
- [The Open Graph protocol](https://ogp.me)
