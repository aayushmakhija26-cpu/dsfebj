---
name: speckit-git-validate
description: Validate current branch follows feature branch naming conventions
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: github-spec-kit
  source: git:commands/speckit.git.validate.md
---

# Validate Feature Branch

Validate that the current Git branch follows the expected feature branch naming conventions.

## Prerequisites

- Check if Git is available by running `git rev-parse --is-inside-work-tree 2>/dev/null`
- If Git is not available, output a warning and skip validation:
  ```
  [specify] Warning: Git repository not detected; skipped branch validation
  ```

## Validation Rules

Get the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

The branch name must match one of these patterns:

1. **Sequential**: `^[0-9]{3,}-` (e.g., `001-feature-name`, `042-fix-bug`, `1000-big-feature`)
2. **Timestamp**: `^[0-9]{8}-[0-9]{6}-` (e.g., `20260319-143022-feature-name`)

## Execution

`speckit.git.validate` checks only the branch naming pattern of the current Git branch.

If on a feature branch (matches either pattern):
- Output: `✓ On feature branch: <branch-name>`

If NOT on a feature branch:
- Output: `✗ Not on a feature branch. Current branch: <branch-name>`
- Output: `Feature branches should be named like: 001-feature-name or 20260319-143022-feature-name`

> Note: `speckit.git.validate` does not currently check for spec directories under `specs/`
> and does not perform `SPECIFY_FEATURE` env-var fallback logic.

## Graceful Degradation

If Git is not installed or the directory is not a Git repository, skip validation entirely and output:
`[specify] Warning: Git repository not detected; skipped branch validation`