---
description: Explore and explain a specific package's structure and purpose
---

Provide a comprehensive overview of a specific package in the Scalar monorepo.

Steps:
1. If package name is not provided, list available packages and ask which to explore

2. Read the package's key files:
   - packages/{name}/package.json - Dependencies and scripts
   - packages/{name}/README.md - Documentation
   - packages/{name}/src/ - Main source files

3. Analyze and report:
   - **Purpose**: What this package does
   - **Dependencies**: Key dependencies and what they're used for
   - **Exports**: Main exports and public API
   - **Structure**: Folder organization
   - **Usage**: How other packages use it (check imports across codebase)
   - **Scripts**: Available npm scripts

4. Show example usage if available in README or tests

5. Highlight any:
   - Important patterns or conventions
   - Integration points with other packages
   - Testing approach

This helps understand how packages work and how to use them in development.
