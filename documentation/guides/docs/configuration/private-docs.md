# Private Docs

This guide shows you how to make a Docs site private and use access groups to choose who can view it. You can set this up in the dashboard and editor, or in your `scalar.config.json`.

Make sure you have created a Scalar Account & are logged in ([see create account guide](../../registry/getting-started.md#create-your-scalar-account))

## Create your first access group

Access groups decide who outside your team can view a private site. Creating one needs the Pro plan or above.

In the [dashboard](https://dashboard.scalar.com), open **Settings** and go to **Configuration → Access Groups**. Click **New Access Group**, give it a name and a slug, then click **Create Access Group**.

<scalar-image
  src="/access-groups-new.png"
  src-dark="/access-groups-new-dark.png"
  alt="The Access Groups settings page with the New Access Group dialog open"
  size="full">
</scalar-image>

Now that you have an access group, you can allow a whole email domain, specific email addresses, or both.

### Allow an email domain

Under **Email Domain**, type a domain like `example.com` and click **Allow**. Anyone with an address at that domain can sign in.

### Allow specific email addresses

Under **Specific Email Addresses**, type an email address and click **Add**.

<scalar-image
  src="/access-group-detail.png"
  src-dark="/access-group-detail-dark.png"
  alt="An access group that allows an email domain and a specific email address"
  size="full">
</scalar-image>

## Make your docs private

Open your [Docs](../getting-started.md) project in the editor and go to **Settings → Privacy**. Under **Access control**:

1. Turn on **Private site**. Visitors now have to sign in, and members of your team always have access.
2. Optionally, pick a **Login portal** to brand the sign-in page. Without one, visitors see the default sign-in page.
3. Under **Access groups**, add the groups that should be able to view the site.

<scalar-image
  src="/docs-settings-privacy.png"
  src-dark="/docs-settings-privacy-dark.png"
  alt="Settings → Privacy in the editor, with Private site turned on and an access group selected"
  size="full">
</scalar-image>

Save and publish your changes for them to take effect. If you delete an access group later, its members lose access immediately.

## Configure in scalar.config.json

The Private Docs toggle, access groups and login portal are also stored in your `scalar.config.json`, so you can set them in your repository:

```json
{
  "siteConfig": {
    "isPrivate": true,
    "accessGroups": ["partners"]
  }
}
```

See [Access Control](site-config.md#access-control) for every property.
