# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeChat Miniprogram for children's activity registration and payment — "少年独角兽 AI 创业营" (Youth Unicorn AI Entrepreneurship Camp). Built on **WeChat Cloud Development** (CloudBase): no HTTP backend, no build pipeline outside WeChat DevTools.

- **Cloud environment ID:** `cloudbase-9g9y5ajj044396e0`
- **AppID:** `wx70052d52823f399a`
- **Base library:** 3.13.0 (glass-easel component framework)

## Development Commands

```bash
npm install        # install tdesign-miniprogram + miniprogram-api-typings
```

- Open repo root in **WeChat DevTools** to run/preview
- After `npm install`: **DevTools → Tools → Build npm** to regenerate `miniprogram/miniprogram_npm/`
- No automated test runner; no CI scripts

## Architecture

Two roots compiled separately:

| Root | Purpose |
|---|---|
| `miniprogram/` | Frontend (TypeScript + WXML + WXSS, runs on device) |
| `cloudfunctions/` | Backend (Node.js Cloud Functions, runs on WeChat CloudBase) |

All frontend→backend calls use `wx.cloud.callFunction()` — no REST/HTTP APIs.

### Frontend Pages Flow

```
index (activity listing)
  → detail?activityId=...          activity detail + period/price display
    → order-form?activityId=...&periodId=...   registration + payment
        ↔ camper-list / camper-info            child profile management
          → registration-payment-success?outTradeNo=...
my (profile/login tab)
  → my-submissions                 order history
    → order-detail                 single order view
```

### Registration + Payment Flow

1. `order-form` calls `login` → gets `userId` (stored in `wx.getStorageSync`)
2. Calls `submissionGetByActivity` to pre-fill if editing
3. User fills form; alumni discount computed client-side via `utils/alumni-discount.ts`
4. `submissionSubmit` or `submissionUpdate` → `paymentPrepare` (server re-validates fee) → `wxpayFunctions` → `wx.requestPayment()`
5. Async: `wxpayOrderCallback` webhook sets `submission.status = 'paid'`

### Cloud Functions

| Function | Purpose |
|---|---|
| `login` | OpenID-based user upsert |
| `childrenSave` / `childrenList` | Child profile CRUD |
| `submissionSubmit` / `submissionUpdate` / `submissionGetByActivity` / `submissionMyList` / `submissionCancel` | Submission lifecycle |
| `paymentPrepare` | Resolves final fee, writes `payOrderNo` + `payAmount` to DB |
| `wxpayFunctions/wxpay_order` | Calls CloudBase built-in `wxpay_order` module |
| `wxpayOrderCallback` | Payment webhook: verifies and marks `paid` |

Shared backend helpers live in `cloudfunctions/_shared/backend-common.js` (`maskIdNo`, `normalizeText`, `createGetOrCreateUser`, `createGetLatestSubmitted`).

### Key Utility Files

- `miniprogram/utils/activities.ts` — hardcoded `activityId → { title, sub, price }` map; update here when adding new activities
- `miniprogram/utils/alumni-discount.ts` — hardcoded list of ~60 returning student names; `resolveAlumniPrice()` applies ¥12,800 rate. **Backend (`paymentPrepare`) re-runs this check server-side** for security.
- `miniprogram/utils/cloud-assets.ts` — maps local paths to CloudBase CDN URLs for poster images

### Database Collections

- `users` — one doc per openid; stores guardian profile, `idNo`, contact info
- `children` — child profiles; linked by `ownerOpenid` and `guardianId`
- `submissions` — registration records with guardian/child snapshots and payment fields (`payOrderNo`, `payAmount`, `payCurrency`, `status`)

Submission statuses: `submitted` → `paid` (webhook) or `cancelled`

Order number format: `MP{YYYYMMDDHHMMSS}{6-digit-random}{last-4-of-openid}`

## Coding Style

- TypeScript `.ts`, WXML templates, WXSS styles
- 2-space indentation; **no semicolons**
- Single quotes in `.ts` (except where keys require double quotes)
- Page folders: kebab-case with business-identifying information when the page is business-specific (`order-detail`, `9-9-survey-questionnaire`, `2026-0425-activity-poster`)
- Avoid vague route/page names like `report`, `activity`, `pay-success`; prefer names that include concrete business identifiers such as price, date, season, or activity code. Only truly shared infrastructure pages may use generic business nouns such as `registration-payment-success`.
- Cloud function names should follow the same principle: business-specific functions should carry concrete identifiers, while only shared infrastructure should use generic names.
- Do not manually edit `miniprogram/miniprogram_npm/` — it's generated

## Known Issues

- **iOS real-device blank list/detail:** check `.scroll-area` container height. Fix: use `min-height: 0` + `flex: 1` instead of `height: 0`.
- Use `wx.createSelectorQuery().boundingClientRect()` to debug layout on real device.

## Commit Style

Short single-line Chinese or English messages (e.g., `老学员分人计费`). Avoid committing `project.private.config.json`.
