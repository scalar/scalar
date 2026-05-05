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

<scalar-detail title="More Info">

Here is some additional content.
</scalar-detail>

```markdown
<scalar-detail title="More Info">

Here is some additional content.
</scalar-detail>
```

### Open by Default

<scalar-detail title="Default Open" open>

The section is open by default.
</scalar-detail>

```markdown
<scalar-detail title="Default Open" open>

The section is open by default.
</scalar-detail>
```

### With Custom Icon

<scalar-detail title="Custom Icon" icon="airplane">

Using a custom icon.
</scalar-detail>

```markdown
<scalar-detail title="Custom Icon" icon="airplane">

Using a custom icon.
</scalar-detail>
```

### Non-interactive Block

<scalar-detail title="Non-Interactive" interactivity=none>

These do not collapse when clicked.
</scalar-detail>

```markdown
<scalar-detail title="Non-Interactive">

These do not collapse when clicked.
</scalar-detail>
```

### Nested

<scalar-detail title="Nested, Outer" >

Outer details content.

<scalar-detail title="Nested, Inner" >

Inner details content.
</scalar-detail>

</scalar-detail>

```markdown
<scalar-detail title="Nested, Outer" >

Outer details content.
<scalar-detail title="Nested, Inner" >

Inner details content.
</scalar-detail>
</scalar-detail>
```
