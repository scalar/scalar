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

<scalar-tabs>
<scalar-tab title="Custom HTML">
<scalar-card>

Card with body.
</scalar-card>

```md
<scalar-card>

Card with body.
<scalar-card>
```

</scalar-tab>
<scalar-tab title="Directive">

:::scalar-card
Card with body.
:::

```md
:::scalar-card
card with body.
:::
```
</scalar-tab>
</scalar-tabs>

### Card with Title and Body


<scalar-tabs>
<scalar-tab title="Custom HTML">
<scalar-card title="The Title of the Card">

Card with title and body.
</scalar-card>

```md
<scalar-card title="The Title of the Card">

Card with title and body.
</scalar-card>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-card{title="The Title of the Card"}
Card with title and body.
:::

```md
:::scalar-card{title="The Title of the Card"}
Card with title and body.
:::
```
</scalar-tab>
</scalar-tabs>

### Card with Icon and Body

<scalar-tabs>
<scalar-tab title="Custom HTML">
<scalar-card icon="solid/basic-shape-hexagon">

Card with icon and body.
</scalar-card>

```md
<scalar-card icon="solid/basic-shape-hexagon">

Card with icon and body.
</scalar-card>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-card{icon="solid/basic-shape-hexagon"}
Card with icon and body.
:::

```md
:::scalar-card{icon="solid/basic-shape-hexagon"}
Card with icon and body.
:::
```
</scalar-tab>
</scalar-tabs>

### Card with Left-Icon, Title and Body

<scalar-tabs>
<scalar-tab title="Custom HTML">
<scalar-card leftIcon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with a `leftIcon`, title, and body
</scalar-card>

```md
<scalar-card leftIcon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with a `leftIcon`, title, and body
</scalar-card>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-card{ leftIcon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with a `leftIcon`, title, and body
:::

```md
:::scalar-card{ leftIcon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with a `leftIcon`, title, and body
:::
```
</scalar-tab>
</scalar-tabs>

### Card with Title

<scalar-tabs>

<scalar-tab title="Custom HTML">

<scalar-card title="Without Body"></scalar-card>

```md
<scalar-card title="Without Body"></scalar-card>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-card{title="Without Body"}

```md
::scalar-card{title="Without Body"}
```
</scalar-tab>
</scalar-tabs>
