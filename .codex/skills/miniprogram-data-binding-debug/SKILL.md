---
name: miniprogram-data-binding-debug
description: Debug WXML data binding and `setData` issues in WeChat Mini Programs. Use when data exists but UI does not update, `wx:for` lists render incorrectly, route params do not switch activity views, or tab/branch conditions render the wrong section.
---

# Miniprogram Data Binding Debug

## Workflow

### 1) Verify data source and route params
- Log route params and decoded values first (especially `activityId`, `periodId`).
- Confirm page/component `data` initializes with safe defaults before async load.
- Ensure derived state is recomputed from one source of truth when route changes.

### 2) Verify `setData` writes the exact fields WXML consumes
- Do not mutate `this.data` directly; update via `this.setData`.
- Match WXML bindings to exact keys (`summaryCoverPath`, `weekendContentPaths`, etc.).
- For nested updates, use path syntax:
```
this.setData({
  'form.user.name': value
})
```

### 3) Validate branch conditions for multi-activity UI
- Confirm mutually exclusive flags are correct (`isFutureCamp`, `isSummerCamp`, `isWeekendCamp`, `isWinterCamp`).
- Check `activeTab` always exists in current `tabs`; fallback when activity type changes.
- Verify `wx:if` branches match the intended activity archetype.

### 4) Validate list rendering and poster arrays
- Ensure `wx:for` data is always an array (never `undefined`/`null`).
- Use stable keys (`wx:key="*this"` for unique string arrays, or explicit ids for object arrays).
- For poster paths, verify fallback expression returns a valid URL/path (`posterUrls[item] || item`).

### 5) Check async timing and post-render measurements
- Confirm async calls succeed before relying on updated UI state.
- Use `wx.nextTick` before `createSelectorQuery` layout reads.
- Remove temporary logs after the root cause is confirmed.
