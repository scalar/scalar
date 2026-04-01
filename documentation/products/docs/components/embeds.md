# Embeds

Embeds allow you to include external content from various platforms directly in your documentation. They support YouTube videos, Vimeo videos, CodePen demos, CodeSandbox projects, and other iframe-compatible content. Each embed automatically optimizes the source URL and includes proper security attributes.

## Properties

### src
`string` _required_

The URL of the content to embed. The component automatically detects and optimizes URLs for supported platforms:

- **YouTube**: Converts watch URLs to embed format
- **Vimeo**: Converts video URLs to player format
- **CodePen**: Converts pen URLs to embed format with preview settings
- **CodeSandbox**: Supports embed URLs with proper sandbox attributes
- **Other**: Generic iframe embedding with security attributes

### caption
`string` _optional_

A descriptive caption for the embedded content. This appears below the embed and provides context or explanation.

### alt
`string` _optional_

Alternative text for accessibility. This describes the embedded content for screen readers and other assistive technologies.

## Examples

### YouTube Video

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-embed
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  caption="Never Gonna Give You Up - Rick Astley">
</scalar-embed>

```html
<scalar-embed
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  caption="Never Gonna Give You Up - Rick Astley">
</scalar-embed>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-embed{ src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Never Gonna Give You Up - Rick Astley"}

```markdown
::scalar-embed{ src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Never Gonna Give You Up - Rick Astley"}
```
</scalar-tab>
</scalar-tabs>

### Vimeo Video

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-embed
  src="https://vimeo.com/844557780"
  caption="Beautiful nature documentary">
</scalar-embed>

```html
<scalar-embed
  src="https://vimeo.com/844557780"
  caption="Beautiful nature documentary">
</scalar-embed>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-embed{ src="https://vimeo.com/844557780" caption="Never Gonna Give You Up - Rick Astley"}

```markdown
::scalar-embed{ src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Beautiful nature documentary"}
```
</scalar-tab>
</scalar-tabs>


### Generic Iframe Content

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-embed
  src="https://en.wikipedia.org/wiki/Open_source"
  caption="Custom interactive content"
  alt="Interactive demonstration of the API">
</scalar-embed>

```html
<scalar-embed
  src="https://en.wikipedia.org/wiki/Open_source"
  caption="Custom interactive content"
  alt="Interactive demonstration of the API">
</scalar-embed>
```
</scalar-tab>

<scalar-tab title="Directive">

::scalar-embed{ src="https://en.wikipedia.org/wiki/Open_source" caption="Custom interactive content" alt="Interactive demonstration of the API"}

```markdown
::scalar-embed{ src="https://en.wikipedia.org/wiki/Open_source" caption="Custom interactive content" alt="Interactive demonstration of the API"}
```
</scalar-tab>
</scalar-tabs>
