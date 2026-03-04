---
name: miniprogram-component-scaffold
description: Create or update reusable WeChat Mini Program components in this repo. Use when asked to add a component, scaffold `miniprogram/components/<kebab>` with `.ts/.wxml/.wxss/.json`, or wire it into `usingComponents` for pages/components.
---

# Miniprogram Component Scaffold

## Overview
Create a component folder under `miniprogram/components/` with the four standard files and wire it into consuming pages/components.

## Workflow

### 1) Confirm intent
- Determine the component name (kebab-case) and its public API (props, events).
- Identify which pages/components will consume it.

### 2) Create component files
Create `miniprogram/components/<component-name>/` with:
- `<component-name>.ts`
- `<component-name>.wxml`
- `<component-name>.wxss`
- `<component-name>.json`

Minimal scaffold:

`<component-name>.ts`
```
Component({
  properties: {},
  data: {},
  methods: {},
})
```

`<component-name>.wxml`
```
<view class="component">
  <!-- TODO: build UI -->
</view>
```

`<component-name>.wxss`
```
.component {
  display: block;
}
```

`<component-name>.json`
```
{
  "component": true,
  "usingComponents": {}
}
```

### 3) Register in consumers
- Add the component to `usingComponents` in the consuming page/component `.json`:
```
{
  "usingComponents": {
    "<tag-name>": "/components/<component-name>/<component-name>"
  }
}
```

### 4) Conventions
- Keep kebab-case names, 2-space indent, single quotes in `.ts`, no semicolons.
- Do not edit `miniprogram/miniprogram_npm`.
