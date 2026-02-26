# Preview Deployments

Preview deployments allow you to see how your documentation changes will look before merging them into your main branch. When you open a pull request, Scalar Docs automatically creates a preview deployment and can post a comment with a link to preview your changes.

## Enable via Configuration

Add the following to your `scalar.config.json`:

```json
{
  // automatically create a preview deployment for every pull request
  "publishPreviews": true,
  // automatically post a comment on your pull request with a direct link to the preview deployment
  "pullRequestComments": true
}
```

### GitHub Pull Request Comments for Preview Deployments

![PR Comment](../../../assets/docs/pr-comment.png)


## CLI

If your Scalar Docs project is not connected to your GitHub repository, use the CLI publish in preview mode (e.g. for pull requests) without going live:

```bash
npx @scalar/cli project publish --slug your-docs --preview
```

## Other Deployment Options

Looking for more control over your deployment process?

- [Automatic Deployment](automatic-deployment.md) - Automatically publish when changes are merged
- [GitHub Actions](github-actions.md) - Trigger deployments based on specific events
- [CLI](cli.md) - Deploy from your terminal or any CI/CD environment
