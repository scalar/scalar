# Callouts

Callouts are highlighted boxes that make important information stand out. They're perfect for showing warnings, tips, or any message you want readers to notice. Each type has its own color and style to help convey the right tone.

## Properties

### type
`CalloutType` *required*

The type of callout: `neutral`, `success`, `danger`, `warning` or `info`


### icon
`string` *optional*

A custom icon to display in the callout. Uses Scalar icon format. If not provided, the component will use the default icon for the specified callout type.

## Examples

### Basic Callout


<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-callout type="info"> This is an informational message. </scalar-callout>

```html
<scalar-callout type="info"> This is an informational message. </scalar-callout>
```
</scalar-tab>

<scalar-tab title="Directive">

:::scalar-callout{type="info"}
This is an informational message.
:::

```markdown
:::scalar-callout{type="info"}
This is an informational message.
:::
```
</scalar-tab>
</scalar-tabs>

### Callout with Custom Icon

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-callout
  type="success"
  icon="check-circle">
  Operation completed successfully!
</scalar-callout>

```html
<scalar-callout
  type="success"
  icon="check-circle">
  Operation completed successfully!
</scalar-callout>
```
</scalar-tab>

<scalar-tab title="Directive">

:::scalar-callout{ type="success" icon="check-circle" }
Operation completed successfully!
:::

```markdown
:::scalar-callout{ type="success" icon="check-circle" }
Operation completed successfully!
:::
```

</scalar-tab>
</scalar-tabs>
