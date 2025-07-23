# Images

Images display visual content with support for light/dark mode variants, clickable links, and responsive sizing. They're perfect for showcasing screenshots, diagrams, charts, or any visual content that enhances your documentation. Each image can include a caption and supports multiple display modes.

## Properties

### src `string` _required_

The primary image source URL. This is the image that will be displayed in light mode or as the fallback.

### activeSrc
`string` _optional_

An alternative image source that takes precedence over `src`. Useful for dynamic image switching or when you need to override the primary source.

### darkModeSrc
`string` _optional_

A separate image source for dark mode. When provided, this image will be displayed when the user's theme is set to dark mode.

### width
`number` _optional_

The width of the image in pixels. When specified, the image size will automatically be set to `custom`.

### height
`number` _optional_

The height of the image in pixels. When specified, the image size will automatically be set to `custom`.

### alt
`string` _optional_

Alternative text for accessibility. This describes the image for screen readers and other assistive technologies.

### caption
`string` _optional_

A descriptive caption for the image. This appears below the image and provides context or explanation.

### href
`string` _optional_

A URL that the image links to. When provided, the image becomes clickable and opens the link in a new tab.

### size
`'actual' | 'custom' | 'full'` _optional_

The display size of the image:

- `actual`: Shows the image at its natural size
- `custom`: Uses custom width/height dimensions
- `full`: Makes the image full width

Defaults to `actual`.

## Examples

### Basic Image

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-image
  src="https://avatars.githubusercontent.com/u/6176314?v=4"
  alt="Application screenshot">
</scalar-image>

```html
<scalar-image
  src="https://avatars.githubusercontent.com/u/6176314?v=4"
  alt="Application screenshot">
</scalar-image>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-image{ src="https://avatars.githubusercontent.com/u/6176314?v=4" alt="Application screenshot" }

```markdown
::scalar-image{ src="https://avatars.githubusercontent.com/u/6176314?v=4" alt="Application screenshot" }
```
</scalar-tab>
</scalar-tabs>

### Image with Caption

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-image
  src="https://avatars.githubusercontent.com/u/6176314?v=4"
  alt="System architecture diagram"
  caption="High-level system architecture showing data flow">
</scalar-image>

```html
<scalar-image
  src="https://avatars.githubusercontent.com/u/6176314?v=4"
  alt="System architecture diagram"
  caption="High-level system architecture showing data flow">
</scalar-image>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-image{ src="https://avatars.githubusercontent.com/u/6176314?v=4" alt="System architecture diagram" caption="High-level system architecture showing data flow" }

```html
::scalar-image{ src="https://avatars.githubusercontent.com/u/6176314?v=4" alt="System architecture diagram" caption="High-level system architecture showing data flow" }
```
</scalar-tab>
</scalar-tabs>

### Clickable Image

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-image
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  alt="Click to view full size"
  href="https://github.com/scalar/scalar"
  caption="Click to access the link">
</scalar-image>

```html
<scalar-image
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  alt="Click to view full size"
  href="https://github.com/scalar/scalar"
  caption="Click to access the link">
</scalar-image>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-image{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" alt="Click to view full size" href="https://github.com/scalar/scalar" caption="Click to access the link" }

```markdown
::scalar-image{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" alt="Click to view full size" href="https://github.com/scalar/scalar" caption="Click to access the link" }
```
</scalar-tab>
</scalar-tabs>

### Custom Sized Image

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-image
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  alt="Company logo"
  width="200"
  height="100"
  caption="Company branding">
</scalar-image>

```html
<scalar-image
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  alt="Company logo"
  width="200"
  height="100"
  caption="Company branding">
</scalar-image>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-image{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" alt="Company logo" width="200" height="100" caption="Company branding" }

```markdown
::scalar-image{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" alt="Company logo" width="200" height="100" caption="Company branding" }
```
</scalar-tab>
</scalar-tabs>

### Dark Mode Image

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-image
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  darkModeSrc="https://avatars.githubusercontent.com/u/6176314?s=200&v=4"
  alt="Theme-aware illustration"
  caption="Automatically adapts to user's theme preference">
</scalar-image>

```html
<scalar-image
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  darkModeSrc="https://avatars.githubusercontent.com/u/6176314?s=200&v=4"
  alt="Theme-aware illustration"
  caption="Automatically adapts to user's theme preference">
</scalar-image>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-image{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" darkModeSrc="https://avatars.githubusercontent.com/u/6176314?s=200&v=4" alt="Theme-aware illustration" caption="Automatically adapts to user's theme preference" }

```markdown
::scalar-image{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" darkModeSrc="https://avatars.githubusercontent.com/u/6176314?s=200&v=4" alt="Theme-aware illustration" caption="Automatically adapts to user's theme preference" }
```
</scalar-tab>
</scalar-tabs>

### Full Width Image

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-image
  src="https://pbs.twimg.com/profile_banners/1599772885857538051/1740351609/1500x500"
  alt="Hero section background"
  size="full"
  caption="Full-width hero image">
</scalar-image>

```html
<scalar-image
  src="https://pbs.twimg.com/profile_banners/1599772885857538051/1740351609/1500x500"
  alt="Hero section background"
  size="full"
  caption="Full-width hero image">
</scalar-image>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-image{ src="https://pbs.twimg.com/profile_banners/1599772885857538051/1740351609/1500x500" alt="Hero section background" size="full" caption="Full-width hero image" }
```markdown
::scalar-image{ src="https://pbs.twimg.com/profile_banners/1599772885857538051/1740351609/1500x500" alt="Hero section background" size="full" caption="Full-width hero image" }
```
</scalar-tab>
</scalar-tabs>
