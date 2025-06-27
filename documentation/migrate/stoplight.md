# How to migrate from Stoplight to Scalar

Scalar makes for a great alternative to Stoplight thanks to its similar features like:

1. An interactive and customizable API reference builder.
2. Team collaboration built-in.
3. Custom domains, theming, and logos.

On top of this, Scalar provides added benefits like:

- **Better pricing.** Most of the features of Scalar can be used for free and the pro plan is only $12/month compared to Stoplight's $52/month.
- **Open source.** Scalar is fully open source and self-hostable.
- **Built-in API client.** Scalar has also built an API client into the API reference, enabling users to send test requests straight from the docs.

If you want to try Scalar, there are two ways of migrating:

1. Using our GitHub sync feature
2. Manually exporting and importing data

## Using GitHub sync

If you are using Stoplight's Git project feature, you can migrate easily using Scalar's GitHub sync feature. It enables you to create and publish an API reference from a GitHub repo with nearly the same structure as Stoplight.

> **Don't have an API docs GitHub repo?** You can also create one from the exported Stoplight project ZIP which we detail later.

To start, sign up and subscribe to [Scalar's Pro plan](https://dashboard.scalar.com/?plans). Afterwards, in your API doc's GitHub repo, create a `scalar.config.json` file. Add the details on your subdomain like `very-cool-api`, guides like `How-to-be-cool.md`, and OpenAPI document like `galaxy.json` like this:

```json
{
  "subdomain": "very-cool-api",
  "guides": [
    {
      "name": "Guides",
      "sidebar": [
        {
          "path": "docs/How-to-be-cool.md",
          "type": "page"
        }
      ]
    }
  ],
  "references": [
		{
      "name": "API Reference",
      "path": "galaxy.json"
    }
  ]
}
```

If you need to generate the paths for your Stoplight docs, you can use this script:

```python
import json
from pathlib import Path

def update_scalar_config():
    with open('scalar.config.json', 'r') as f:
        config = json.load(f)

    docs_dir = Path('docs')
    md_files = list(docs_dir.glob('*.md'))

    sidebar_entries = []
    for md_file in md_files:
      sidebar_entries.append({ "path": f"docs/{md_file.name}", "type": "page" })

    for guide in config['guides']:
      if guide['name'] == 'Guides':
        guide['sidebar'] = sidebar_entries
        break
    else:
      config['guides'].append({ "name": "Guides", "sidebar": sidebar_entries })

    with open('scalar.config.json', 'w') as f:
      json.dump(config, f, indent=2)

if __name__ == '__main__':
  update_scalar_config()
```

After adding the `scalar.config.json` file to your repo, head to Scalar. On the [dashboard](https://dashboard.scalar.com/), click **Link GitHub Account** and provide access to your API docs repo. Once back in Scalar, select that repository when creating a new GitHub project, correct any details, and press **Publish**.

![Syncing in Scalar](https://cdn.scalar.com/images/blog/sl-sync.png)

Once the site is built and deployed, you'll be able to see it at the URL you set in `scalar.config.json`.

![Published API Reference](https://cdn.scalar.com/images/blog/sl-api.png)

## Manually exporting data from Stoplight

If you aren't using Stoplight's Git projects feature or just want to customize the migration details, you can manually export your Stoplight project data and add it to Scalar.

To start with this, go to your project's studio page, click the three line drop down in the top right, and click **Download project ZIP**.

![Downloading the project ZIP](https://cdn.scalar.com/images/blog/sl-zip.png)

If you want more control over which OpenAPI documents you migrate, you can also go to your doc page, click **Export**, and choose either **Original** to keep `$ref` values to other docs or **Bundled References** to include everything inline.

![Exporting the project](https://cdn.scalar.com/images/blog/sl-export.png)

At this point, you can either:

1. Set up a GitHub repo with the exported project ZIP or OpenAPI file and follow the instructions to use GitHub sync
2. Manually upload the OpenAPI doc to Scalar

We already covered the first option earlier in this doc, so we will just focus on the second here.

### Manually importing data into Scalar

If you only want to upload and use the OpenAPI document as a reference, you can directly upload it to Scalar:

1. [Sign up for a Scalar account](https://dashboard.scalar.com/register).
2. In Scalar, create a new documentation project.
3. Once created, select the **reference** tab, upload your exported OpenAPI doc, and you'll have a fully functional and customizable API reference set up.

![Editing the OpenAPI doc](https://cdn.scalar.com/images/blog/sl-edit.png)

You can then edit the details of the OpenAPI doc, recreate documents under the **guide** tab, and customize your headers, logos, styles, and more.
