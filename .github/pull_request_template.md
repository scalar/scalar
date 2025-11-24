<!-- 
  Note: An AI (Bugbot) automatically creates a summary of your changes.
  You don't need to write a manual description – focus on the checklist below.
-->

<!--
  PR Title: Use semantic format with package scope
  Format: <type>(<package>): <subject>
  
  Example: "fix(api-client): prevent crash when API returns null"
  Example: "feat(themes): add dark mode toggle to settings"
  Example: "docs(configuration): update authentication guide"
  
  See CONTRIBUTING.md for full type descriptions
-->

## Checklist

Please ensure the following points are met:

- [ ] **I have explained WHY this change is necessary**
  <!-- 
    E.g.: "Fixes #123" or "Customers report that feature X is missing"
    Helps the team understand why we're making this change.
  -->

- [ ] **I have added tests for new features or bugfixes**
  <!--
    New features: Add tests that cover the feature
    Bugfixes: Add a regression test that reproduces the bug
    If tests don't make sense, briefly explain why.
  -->

- [ ] **I have updated the documentation (if needed)**
  <!--
    Has an API changed? Was a new feature added?
    Then the docs need to be updated too.
    If no doc changes are needed, you can check this off.
  -->

- [ ] **I have created a changeset**
  <!--
    Run `pnpm changeset` in your terminal and follow the prompts:
    1. Select the packages affected by your changes
    2. Choose the change type:
       - patch: Bug fixes, small changes (0.0.X)
       - minor: New features, backwards compatible (0.X.0)
       - major: Breaking changes (X.0.0)
    3. Write a short summary for the changelog
  -->

---

<!-- More info: https://github.com/scalar/scalar/blob/main/CONTRIBUTING.md -->
