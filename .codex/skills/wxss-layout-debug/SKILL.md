---
name: wxss-layout-debug
description: Debug WeChat Mini Program layout issues, especially iOS real-device cases where list/detail does not display despite data. Use to inspect `.scroll-area` containers, fix `min-height`/`flex`, and log `boundingClientRect` to confirm layout size.
---

# WXSS Layout Debug

## Overview
Diagnose common Mini Program layout failures by checking scroll containers, flex sizing, and runtime element sizes on real devices.

## Workflow

### 1) Reproduce on device
- Prefer iOS real device for the known issue where data exists but UI is blank.
- Verify whether the issue is a render/layout problem or a data problem.

### 2) Fix scroll container sizing
If a `.scroll-area` container exists:
- Keep `flex: 1`.
- Replace `height: 0` with `min-height: 0`.

Example fix:
```
.scroll-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

### 3) Log bounding box sizes
Add a quick debug log to confirm actual layout size:
```
wx.nextTick(() => {
  wx.createSelectorQuery()
    .select('.scroll-area')
    .boundingClientRect(rect => {
      console.log('scroll-area rect', rect)
    })
    .exec()
})
```

### 4) Verify rendering conditions
- Check `wx:if` or `hidden` conditions that might hide the list.
- Ensure container height is not collapsed by a parent with `overflow: hidden` and no height.

### 5) Clean up
- Remove debug logs after confirmation.
