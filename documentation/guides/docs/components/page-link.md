# Page Link

Page Link creates a styled link to another guide page. It includes a title and optional description, and should be used to connect readers to relevant content elsewhere in the guide.

## Properties

### filepath
`string` *required*
Relative path to the destination page. Paths a relative to the root (by default the config).

### title
`string` *optional*
The title shown in the link. Defaults to `"Link to Page"`.

### description
`string` *optional*
Secondary text shown below the title. Defaults to `"Link to a page in the guide"`.

## Examples

### Link with Path Only

<scalar-page-link filepath="documentation/guides/docs/components/row.md">
</scalar-page-link>

```markdown
<scalar-page-link filepath="documentation/guides/docs/components/row.md">
</scalar-page-link>
```

### Link with Path and Title

<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="">
</scalar-page-link>

```markdown
<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="">
</scalar-page-link>
```

### Link with Path, Title and Description

<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="Row component documentation">
</scalar-page-link>

```markdown
<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="Row component documentation">
</scalar-page-link>
```
