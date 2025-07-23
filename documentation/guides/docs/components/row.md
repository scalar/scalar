# Row

Row displays its children in a horizontal layout with consistent spacing. It's useful for placing multiple elements side-by-side, such as cards or callouts.

## Properties

*(None)*  
This component does not accept any attributes.

## Examples

### Row of Cards

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-row>
<scalar-card icon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with title, body, and icon.
</scalar-card>
<scalar-card icon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with title, body, and icon.
</scalar-card>
<scalar-card icon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with title, body, and icon.
</scalar-card>
</scalar-row>

```md
<scalar-row>
<scalar-card icon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with title, body, and icon.
</scalar-card>
<scalar-card icon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with title, body, and icon.
</scalar-card>
<scalar-card icon="solid/basic-shape-hexagon" title="The Title of the Card">

Card with title, body, and icon.
</scalar-card>
</scalar-row>
```

</scalar-tab>

<scalar-tab title="Directive">

::::scalar-row
:::scalar-card{icon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with title, body, and icon.
:::
:::scalar-card{icon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with title, body, and icon.
:::
:::scalar-card{icon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with title, body, and icon.
:::
::::

```md
::::scalar-row
:::scalar-card{icon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with title, body, and icon.
:::
:::scalar-card{icon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with title, body, and icon.
:::
:::scalar-card{icon="solid/basic-shape-hexagon" title="The Title of the Card"}
Card with title, body, and icon.
:::
::::
```
</scalar-tab>
</scalar-tabs>

