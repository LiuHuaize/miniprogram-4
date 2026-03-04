---
name: miniprogram-page-scaffold
description: Create or update WeChat Mini Program pages in this repo. Use when asked to add a new page/screen, rename a page, or scaffold `miniprogram/pages/<kebab>` with `.ts/.wxml/.wxss/.json`, and wire it into `miniprogram/app.json` while following repo conventions (2 spaces, single quotes, no semicolons).
---

# Miniprogram Page Scaffold

## Overview
Create a new page folder under `miniprogram/pages/` with the four standard files, keep naming and style conventions, and register the page in `miniprogram/app.json` when needed.

## Workflow

### 1) Confirm intent
- Determine the page folder name (kebab-case) and the route path (e.g., `pages/order-form/order-form`).
- Ask whether the page should be in `tabBar` or just a normal route.
- Confirm the navigation bar title and any required components.

### 2) Create page files
Create `miniprogram/pages/<page-name>/` with:
- `<page-name>.ts`
- `<page-name>.wxml`
- `<page-name>.wxss`
- `<page-name>.json`

Use a minimal, style-safe scaffold:

`<page-name>.ts`
```
Page({
  data: {},
  onLoad() {},
})
```

`<page-name>.wxml`
```
<view class="page">
  <!-- TODO: build UI -->
</view>
```

`<page-name>.wxss`
```
.page {
  min-height: 100%;
}
```

`<page-name>.json`
```
{
  "navigationBarTitleText": "TODO",
  "usingComponents": {}
}
```

### 3) Register in app.json
- Add `pages/<page-name>/<page-name>` to `miniprogram/app.json` `pages` list.
- If the page is a tab, update `tabBar.list` accordingly.
- Avoid touching `project.private.config.json` and `miniprogram/miniprogram_npm`.

### 4) Conventions to enforce
- Page folders are kebab-case.
- Indentation is 2 spaces, use single quotes in `.ts`, no semicolons.
- Don’t manually edit `miniprogram/miniprogram_npm`.

### 5) Manual verification
- In WeChat DevTools, navigate to the new page route and confirm it renders.
