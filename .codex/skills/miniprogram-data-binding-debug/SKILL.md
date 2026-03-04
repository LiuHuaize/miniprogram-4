---
name: miniprogram-data-binding-debug
description: Debug WXML data binding and `setData` issues in WeChat Mini Programs. Use when data exists but UI does not update, `wx:for` lists render incorrectly, or bindings/conditions behave unexpectedly.
---

# Miniprogram Data Binding Debug

## Overview
Fix common binding and rendering mistakes in WXML + `setData` flows.

## Workflow

### 1) Verify data shape
- Log data before and after `setData` to ensure the expected shape.
- Avoid mutating `this.data` directly; always call `this.setData`.

### 2) Check WXML conditions
- Verify `wx:if`, `wx:elif`, `wx:else`, or `hidden` conditions are correct.
- Ensure conditions are not relying on `undefined` or empty arrays.

### 3) Fix list rendering
- Use `wx:for` with a stable `wx:key`.
- Ensure the list is an array and exists before render.

### 4) Update nested paths correctly
- Use path updates for nested fields:
```
this.setData({
  'form.user.name': value
})
```

### 5) Timing and async
- If `setData` happens after async requests, confirm the request succeeded and `setData` is called in the callback.
- Use `wx.nextTick` if you need to read layout after rendering.
