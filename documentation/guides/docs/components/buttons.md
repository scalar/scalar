# Buttons

Buttons are interactive elements that create clickable links to external resources. They're perfect for directing users to documentation, downloads, or any external URL. Each button can include an icon and opens links in a new tab for better user experience.

## Properties

### title
`string` _required_

The text displayed on the button. This is the primary label that users will see and click on.

### href
`string` _required_

The URL that the button links to. When clicked, this will open in a new tab with proper security attributes (`rel="noopener noreferrer"`).

### icon
`string` _optional_

An icon to display alongside the button text. Can be either a path to a local Scalar icon or a URL to an external icon. If not provided, the button will display only text.

## Examples

### Basic Button

<scalar-button
  title="View Documentation"
  href="https://docs.scalar.com">
</scalar-button>

```html
<scalar-button
  title="View Documentation"
  href="https://docs.scalar.com">
</scalar-button>
```

### Button with Icon

<scalar-button
  title="Download SDK"
  href="https://github.com/scalar/scalar"
  icon="solid/interface-download">
</scalar-button>

```html
<scalar-button
  title="Download SDK"
  href="https://github.com/scalar/scalar"
  icon="solid/interface-download">
</scalar-button>
```

### Button with External Icon

<scalar-button
  title="Visit Website"
  href="https://scalar.com"
  icon="https://example.com/icon.svg">
</scalar-button>

```html
<scalar-button
  title="Visit Website"
  href="https://scalar.com"
  icon="https://example.com/icon.svg">
</scalar-button>
```
