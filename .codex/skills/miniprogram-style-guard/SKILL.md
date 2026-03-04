---
name: miniprogram-style-guard
description: "Enforce repo conventions for the WeChat Mini Program. Use after edits or when asked to clean/format/organize: 2-space indent, single quotes, no semicolons, kebab-case page folders, keep `.ts/.wxml/.wxss/.json` pairs, and avoid touching `miniprogram/miniprogram_npm` and `project.private.config.json`."
---

# Miniprogram Style Guard

## Overview
Apply project conventions and guardrails across Mini Program files and structure.

## Checklist
- Keep all page folders kebab-case under `miniprogram/pages/`.
- Ensure each page folder has `.ts/.wxml/.wxss/.json` with matching basename.
- Use 2-space indentation; no semicolons in `.ts`.
- Prefer single quotes in `.ts` (except when JSON key requires quotes).
- Do not manually edit `miniprogram/miniprogram_npm`.
- Avoid changes to `project.private.config.json` unless explicitly requested.

## Quick checks (use rg)
- Find non-kebab page folders:
  - `rg --files -g 'miniprogram/pages/**'`
- Find accidental edits in `miniprogram_npm`:
  - `rg --files -g 'miniprogram/miniprogram_npm/**'`

## Fix strategy
- Normalize names and references when renaming folders.
- Keep JSON strictly double-quoted; keep `.ts` single-quoted.
