# Card

Cards display content inside a bordered box, optionally with a title and icon. They are useful for visually grouping related text or UI elements.

## Properties

### title
`string` *optional*
Adds a title to the top of the card.

### icon
`string` *optional*
Displays an icon in the title area. Uses the Scalar icon format. If both `title` and `icon` are provided, the icon appears before the title.

### leftIcon
`string` *optional*
Displays a large icon to the left of the card content.

## Examples

### Card with Body Only

<scalar-card>
Card with body.
</scalar-card>

```markdown
<scalar-card>
Card with body.
<scalar-card>
```

### Card with Title and Body

<scalar-card title="The Title of the Card">
Card with title and body.
</scalar-card>

```markdown
<scalar-card title="The Title of the Card">
Card with title and body.
</scalar-card>
```

### Card with Icon and Body

<scalar-card icon="solid/basic-shape-hexagon">
Card with icon and body.
</scalar-card>

```markdown
<scalar-card icon="solid/basic-shape-hexagon">
Card with icon and body.
</scalar-card>
```

### Card with Left-Icon, Title and Body

<scalar-card leftIcon="solid/basic-shape-hexagon" title="The Title of the Card">
Card with a `leftIcon`, title, and body
</scalar-card>

```markdown
<scalar-card leftIcon="solid/basic-shape-hexagon" title="The Title of the Card">
Card with a `leftIcon`, title, and body
</scalar-card>
```

### Card with Title

<scalar-card title="Without Body"></scalar-card>

```markdown
<scalar-card title="Without Body"></scalar-card>
```
