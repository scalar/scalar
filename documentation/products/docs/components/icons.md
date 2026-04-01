# Icons

Icons display scalable vector graphics and symbols to enhance your documentation with visual cues. They're perfect for indicating features, status, navigation, or adding visual interest to your content. Each icon supports custom sizing, styling, and accessibility features.

## Properties

### src

`string` _required_

The icon source URL or identifier. This can be a URL to an SVG file, a regular image file (PNG, JPG, etc.), an icon library identifier, or a path to an icon resource.

### title

`string` _optional_

The title attribute for the icon, providing accessible text that describes the icon's purpose. This is read by screen readers and shown as a tooltip on hover.

### class

`string` _optional_

Custom CSS classes to apply to the icon. Multiple classes can be provided as a space-separated string for additional styling control.

### size

`string` _optional_

The display size of the icon as a CSS width/height value. This controls how large the icon appears in your documentation. Accepts any valid CSS size unit such as `16px`, `1.5em`, `2rem`, `100%`, etc.

## Examples

### Basic Icon

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-icon
  src="check-circle"
  title="Success indicator">
</scalar-icon>

```html
<scalar-icon
  src="check-circle"
  title="Success indicator">
</scalar-icon>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-icon{ src="check-circle" title="Success indicator" }

```markdown
::scalar-icon{ src="check-circle" title="Success indicator" }
```

</scalar-tab>
</scalar-tabs>

### Icon with Custom Classes

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-icon
  src="warning"
  title="Warning message"
  class="text-yellow-500 mr-2">
</scalar-icon>

```html
<scalar-icon
  src="warning"
  title="Warning message"
  class="mr-2 text-yellow-500">
</scalar-icon>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-icon{ src="warning" title="Warning message" class="text-yellow-500 mr-2" }

```markdown
::scalar-icon{ src="warning" title="Warning message" class="text-yellow-500 mr-2" }
```

</scalar-tab>
</scalar-tabs>

### Sized Icon

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-icon
  src="info"
  title="Information"
  size="24px"
  class="text-blue-600">
</scalar-icon>

```html
<scalar-icon
  src="info"
  title="Information"
  size="24px"
  class="text-blue-600">
</scalar-icon>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-icon{ src="info" title="Information" size="24px" class="text-blue-600" }

```markdown
::scalar-icon{ src="info" title="Information" size="24px" class="text-blue-600" }
```

</scalar-tab>
</scalar-tabs>

### Different Size Units

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-icon
  src="star"
  title="Small icon"
  size="16px">
</scalar-icon>

<scalar-icon
  src="star"
  title="Medium icon"
  size="1.5em">
</scalar-icon>

<scalar-icon
  src="star"
  title="Large icon"
  size="2rem">
</scalar-icon>

```html
<scalar-icon
  src="star"
  title="Small icon"
  size="16px">
</scalar-icon>

<scalar-icon
  src="star"
  title="Medium icon"
  size="1.5em">
</scalar-icon>

<scalar-icon
  src="star"
  title="Large icon"
  size="2rem">
</scalar-icon>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-icon{ src="star" title="Small icon" size="16px" }

::scalar-icon{ src="star" title="Medium icon" size="1.5em" }

::scalar-icon{ src="star" title="Large icon" size="2rem" }

```markdown
::scalar-icon{ src="star" title="Small icon" size="16px" }

::scalar-icon{ src="star" title="Medium icon" size="1.5em" }

::scalar-icon{ src="star" title="Large icon" size="2rem" }
```

</scalar-tab>
</scalar-tabs>

### Icon from URL

Icons can load from external URLs, supporting both SVG files and regular image formats (PNG, JPG, etc.).

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-icon
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  title="Custom icon from URL"
  class="icon-custom"
  size="4em">
</scalar-icon>

```html
<scalar-icon
  src="https://avatars.githubusercontent.com/u/301879?s=200&v=4"
  title="Custom icon from URL"
  class="icon-custom"
  size="4em">
</scalar-icon>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-icon{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" title="Custom icon from URL" class="icon-custom" size="4em" }

```markdown
::scalar-icon{ src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" title="Custom icon from URL" class="icon-custom" size="4em" }
```

</scalar-tab>
</scalar-tabs>
