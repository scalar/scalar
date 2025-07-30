# Details

Details provide collapsible content sections that can be expanded or hidden by the reader. Useful for explanations, optional information, or progressive disclosure.
Collapsing behavior can be disabled to create a static block.

## Properties

### title

`string` _optional_  
The title shown in the summary section.

### icon

`string` _optional_  
The icon displayed next to the title. Uses Scalar icon format. Defaults to `line/arrow-chevron-right`.

### interactivity

`string` _optional_  
Controls whether the component is interactive (`details`) or static (`div`).  
Use `"none"` to render a non-collapsible container.

### open

`boolean` _optional_  
If `true`, the section starts expanded. The default behavior is for the section
to start in a collapsed state.

## Examples

### Basic Collapsible Section

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-detail title="More Info">

Here is some additional content.
</scalar-detail>

```md
<scalar-detail title="More Info">

Here is some additional content.
</scalar-detail>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-detail{title="More Info"}
Here is some additional content.
:::

```md
:::scalar-detail{title="More Info"}
Here is some additional content.
:::
```

</scalar-tab>
</scalar-tabs>

### Open by Default

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-detail title="Default Open" open>

The section is open by default.
</scalar-detail>

```md
<scalar-detail title="Default Open" open>

The section is open by default.
</scalar-detail>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-detail{title="Default Open" open='true'}
The section is open by default.
:::

```md
:::scalar-detail{title="Default Open" open='true'}
The section is open by default.
:::
```

</scalar-tab>
</scalar-tabs>

### With Custom Icon

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-detail title="Custom Icon" icon="airplane">

Using a custom icon.
</scalar-detail>

```md
<scalar-detail title="Custom Icon" icon="airplane">

Using a custom icon.
</scalar-detail>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-detail{title="Custom Icon" icon="airplane" }
Using a custom icon.
:::

```md
:::scalar-detail{title="Custom Icon" icon="airplane"}
Using a custom icon.
:::
```

</scalar-tab>
</scalar-tabs>

### Non-interactive Block

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-detail title="Non-Interactive" interactivity=none>

These do not collapse when clicked.
</scalar-detail>

```md
<scalar-detail title="Non-Interactive">

These do not collapse when clicked.
</scalar-detail>
```

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-detail{title="Non-Interactive" interactivity="none" }
These do not collapse when clicked.
:::

```md
:::scalar-detail{title="Non-Interactive" interactivity="none" }
These do not collapse when clicked.
:::
```

</scalar-tab>
</scalar-tabs>

### Nested


<scalar-tabs>
<scalar-tab title="Custom HTML">
<scalar-detail title="Nested, Outer" >

Outer details content.

<scalar-detail title="Nested, Inner" >

Inner details content.
</scalar-detail>

</scalar-detail>

```md
<scalar-detail title="Nested, Outer" >

Outer details content.
<scalar-detail title="Nested, Inner" >

Inner details content.
</scalar-detail>
</scalar-detail>
```

</scalar-tab>

<scalar-tab title="Directive">

::::scalar-detail{title="Nested, Outer" }
With directives, the parent must have at least 1 more `:` than the elements it wraps.

:::scalar-detail{title="Non-Interactive" }
Inner details content.
:::
::::

```md
::::scalar-detail{title="Nested, Outer" }
With directives, the parent must have at least 1 more `:` than the elements it wraps.

:::scalar-detail{title="Non-Interactive" }
Inner details content.
:::
::::
```
