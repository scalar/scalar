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

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-page-link filepath="documentation/guides/docs/components/row.md">
</scalar-page-link>

```md
<scalar-page-link filepath="documentation/guides/docs/components/row.md">
</scalar-page-link>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-page-link{filepath="documentation/guides/docs/components/row.md"}

```md
::scalar-page-link{filepath="documentation/guides/docs/components/row.md"}
```

</scalar-tab>
</scalar-tabs>


### Link with Path and Title

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="">
</scalar-page-link>

```md
<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="">
</scalar-page-link>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-page-link{filepath="documentation/guides/docs/components/row.md" title="Row Docs" description=""}

```md
::scalar-page-link{filepath="documentation/guides/docs/components/row.md" title="Row Docs" description=""}
```

</scalar-tab>
</scalar-tabs>

### Link with Path, Title and Description

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="Row component documentation">
</scalar-page-link>

```md
<scalar-page-link filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="Row component documentation">
</scalar-page-link>
```

</scalar-tab>

<scalar-tab title="Directive">

::scalar-page-link{filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="Row component documentation"}

```md
::scalar-page-link{filepath="documentation/guides/docs/components/row.md" title="Row Docs" description="Row component documentation"}
```

</scalar-tab>
</scalar-tabs>

