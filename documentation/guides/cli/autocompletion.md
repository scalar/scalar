# Autocompletion

[Install the CLI](getting-started.md#installation), then follow the steps for your shell to complete commands, flags, and option values with Tab.

## Bash

Generate the completion script:

```bash
mkdir -p ~/.local/share/scalar
scalar completion bash > ~/.local/share/scalar/completion.bash
```

Add this line to `~/.bashrc`:

```bash
source ~/.local/share/scalar/completion.bash
```

## Zsh

Generate the completion script:

```zsh
mkdir -p ~/.zsh/completions
scalar completion zsh > ~/.zsh/completions/_scalar
```

Add this line to `~/.zshrc` before any existing `compinit` call or shell framework initialization:

```zsh
fpath=(~/.zsh/completions $fpath)
```

If your configuration does not already initialize completion, add this after the `fpath` line:

```zsh
autoload -Uz compinit
compinit
```

## Fish

Generate the completion script. Fish loads it automatically:

```fish
mkdir -p ~/.config/fish/completions
scalar completion fish > ~/.config/fish/completions/scalar.fish
```

## Try it

Open a new terminal, type `scalar `, and press Tab.

New commands appear automatically after CLI upgrades. Regenerate the script to pick up changes to the shell adapter.
