# Markdown Sync

The Scalar Markdown Sync allows you to automatically publish a bunch of Markdown files as a beautiful documentation website.

## Getting started

The following guide takes you from zero to deployed documentation in just a few minutes:

### Configure your repository

Use your existing [GitHub](https://github.com/) repository, or create a new one.

If you have a few Markdown files already, that’s awesome. Otherwise, just create a new `docs` folder and add at least one [Markdown file](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax):

```bash
# Create a docs/ folder
mkdir docs

# Create an example file
echo "# Hello World" > docs/introduction.md
```

That should be enough to prepare your content. Time to configure your project, let’s create a Scalar configuration file:

```bash
touch scalar.config.json
```

And now, add the content below. Note: You want to modify the custom domain. The one in the example is already taken. :) Your deployment will be available at `https://<subdomain>.apidocumentation.com`.

```json
{
  "subdomain": "my-awesome-documentation",
  "guides": [
    {
      "name": "My awesome documentation",
      "sidebar": [
        {
          "path": "docs/introduction.md",
          "type": "page"
        }
      ]
    }
  ],
  "references": []
}
```

Make sure to commit and push the changes to your repository.

### Connect your repository to Scalar

Create a free Scalar account here: https://docs.scalar.com/register

Once signed in, click on “Projects” in the top left corner and then on “Link GitHub Account”. You’ll be redirected to GitHub, where you can connect your account. After connecting your account, you’ll be redirected back to Scalar.

Click on “Projects” again, then on “New GitHub Project” to set up your project.

### Publish changes

To publish your site for the first time, click on “Projects”, select your project and then click on the “Deployments” button. This opens a modal where you can click “Publish Project”.

Your documentation is now generated for you and deployed to our super fast edge servers, this will take a few minutes.

Once done, you’ll see a message in the “Deployments” modal linking to your new documentation site. Congratulations, you’ve made it!

## Advanced configuration

There’s definitely more to configure. Here are some more options for you:

### Add an OpenAPI reference

Add an OpenAPI/Swagger file to your configuration file:

```json
{
  "references": [
    {
      "name": "API Reference",
      "path": "docs/openapi.yaml"
    }
  ]
}
```

That’s it. :) The next time your documentation is published, it’ll include a super cool API reference.

### Deploy on merge

You can use the UI on https://docs.scalar.com or the Scalar configuration file to enable _Publish on Merge_, which – you might have guessed it — publishes your documentation when a branch is merged into the default branch (`main`):

```json
{
  "publishOnMerge": true
}
```

### Use a custom theme

You don’t like how the documentation looks? Just try a few of our themes:

```json
{
  "theme": "purple"
}
```

Available themes:

- `alternate`
- `default`
- `moon`
- `purple`
- `solarized`
- `bluePlanet`
- `deepSpace`
- `saturn`
- `kepler`
- `mars`

### Use a custom domain

Okay, this requires a subscription, but it’s pretty neat: You can add a custom domain to stay fully on brand and we’ll make sure to deploy your documentation, get a SSL certificate and all that.

```json
{
  "customDomain": "docs.example.com"
}
```

Head to your domain name provider (Namecheap, GoDaddy, …) and add the following DNS records to the domain name you’d like to publish to:

| Type    | Host                                         | Value            |
| ------- | -------------------------------------------- | ---------------- |
| `CNAME` | `docs` (if the domain is `docs.example.com`) | `dns.scalar.com` |

## Support

If you have any questions or face any issues, [join our Discord](https://discord.gg/scalar) or reach out to <marc@scalar.com>
