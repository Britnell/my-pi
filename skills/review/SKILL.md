---
name: review
description: Review completed work with the reviewer subagent. Use when you believe you have completed a task or made non-trivial changes, before reporting done. Delegate the review to the reviewer subagent; do not review your own work in your own head.
---

# Review

Delegate the final check of your work to the **reviewer** subagent. Always pass it:

1. **The original user request** and the task specification/requirements you were given — so it can judge whether the change actually solves the problem and whether a simpler solution exists, not just code quality.
2. **The changed files / diff** and the baseline (commit, branch, or merge-base) to diff against.

Skip only for trivial changes (renames, formatting, config tweaks); use judgment.
