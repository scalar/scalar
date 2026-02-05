# Build Failures

When a deployment fails, use these tools to diagnose the issue:

```bash
# Validate your configuration
scalar project check-config

# Run a local preview to surface warnings
scalar project preview
```

Check the [Scalar Dashboard](https://dashboard.scalar.com/) for detailed build logs.

## Common Issues

### Subdomain Conflicts

If your build fails silently, verify your subdomain is not already in use.

Fun fact: Subdomain conflicts do not currently produce an explicit error. (I know, I know… We'll improve this. So sorry.)

### Need Help?

Contact [support@scalar.com](mailto:support@scalar.com), we'll help you swiftly.
