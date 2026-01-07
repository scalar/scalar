# Claude Code Configuration

This directory contains Claude Code configuration files that enhance the development experience with AI-powered assistance.

## Structure

```
.claude/
├── settings.json          # Permissions and security settings
├── commands/              # Custom slash commands
│   ├── test-package.md    # Test a specific package
│   ├── new-package.md     # Create a new package
│   ├── pr.md              # Create comprehensive PR
│   ├── check-quality.md   # Run all quality checks
│   └── explore-package.md # Explore package structure
├── hooks/                 # Automation scripts
│   ├── user-prompt-submit.sh  # Pre-prompt validation
│   ├── pre-commit.sh      # Pre-commit quality checks
│   └── post-edit.sh       # Auto-format after edits
├── agents/                # Specialized AI subagents
│   ├── vue-expert.md      # Vue.js specialist
│   ├── test-engineer.md   # Testing specialist
│   ├── openapi-specialist.md  # OpenAPI expert
│   └── monorepo-architect.md  # Monorepo specialist
└── README.md              # This file
```

## Quick Start

### Using Slash Commands

Slash commands provide quick access to common workflows:

```
/test-package api-client      # Run tests for @scalar/api-client
/new-package                  # Create a new package (interactive)
/pr                           # Create a comprehensive PR
/check-quality                # Run format, lint, types, tests
/explore-package helpers      # Explore the helpers package
```

### Using Specialized Agents

When you need expert help in specific areas, reference the specialized agents in your prompts:

- **Vue Components**: "Using the vue-expert agent, refactor this component..."
- **Testing**: "Ask the test-engineer to write comprehensive tests..."
- **OpenAPI**: "Have the openapi-specialist validate this spec..."
- **Monorepo**: "Ask the monorepo-architect about package dependencies..."

### Automation Hooks

Hooks run automatically:

- **user-prompt-submit.sh**: Runs before prompts, warns about dangerous operations
- **pre-commit.sh**: Runs quality checks before commits
- **post-edit.sh**: Auto-formats files after Claude edits them

## Configuration

### settings.json

Defines allowed/denied commands and file patterns for security:

- **Allowed**: pnpm, git, gh, node, turbo, vitest, playwright, etc.
- **Denied**: Destructive operations (rm -rf, shutdown, etc.)
- **File patterns**: TypeScript, Vue, JSON, Markdown, etc.

Edit this file to customize permissions for your workflow.

### .claudeignore

Located in the project root, excludes files from Claude's context:
- node_modules, dist, build outputs
- Cache directories
- Lock files
- IDE configs

This reduces token usage and improves performance.

## Best Practices

1. **Keep CLAUDE.md concise** - Focus on essential information
2. **Use pointers, not copies** - Reference files instead of duplicating code
3. **Leverage slash commands** - Create commands for frequent workflows
4. **Use specialized agents** - Get expert help for specific domains
5. **Maintain hooks** - Update automation as project needs change

## Customization

### Adding a New Slash Command

1. Create `.claude/commands/my-command.md`
2. Add frontmatter with description:
   ```markdown
   ---
   description: Brief description of what this command does
   ---

   Detailed instructions for Claude...
   ```
3. Use with `/my-command`

### Creating a New Agent

1. Create `.claude/agents/my-agent.md`
2. Define expertise and responsibilities
3. Provide context-specific guidelines
4. Reference in prompts: "Ask the my-agent about..."

### Modifying Hooks

Hooks are bash scripts that run at specific events:
- Make them executable: `chmod +x .claude/hooks/my-hook.sh`
- Return exit code 0 to allow, 1 to block
- Add useful output for user feedback

## Maintenance

- Review and update configurations as the project evolves
- Add new commands for frequently repeated tasks
- Update agent knowledge when architecture changes
- Keep the backup CLAUDE.md in sync with major changes

## Resources

- [Claude Code Documentation](https://code.claude.com/docs)
- [CLAUDE.md Best Practices](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)

## Backup

The original detailed CLAUDE.md has been preserved as `CLAUDE.backup.md` in the project root.
