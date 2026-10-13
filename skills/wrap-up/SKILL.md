---
name: wrap-up
description: "Run all wrap-up steps when you believe a task is complete, before reporting done. Currently - delegate a review to the reviewer subagent (never review your own work in your own head); add further completion checks (typechecker, linters, etc.) here as they become available."
---

# Wrap-up

when you believe the task is complete hand over to the **Reviewer** subagent, pass it:

- **The original user request** and the task specification/requirements you were given — so it can judge whether the change actually solves the problem and whether a simpler solution exists, not just code quality.
- **The changed files / diff** and the baseline (commit, branch, or merge-base) to diff against.

Skip only for minor trivial changes (renames, formatting, config tweaks)
