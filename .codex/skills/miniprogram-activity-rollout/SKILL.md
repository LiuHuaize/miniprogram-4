---
name: miniprogram-activity-rollout
description: Add or update an activity/workshop across this repo with consistent `activityId` wiring. Use when introducing a new camp/workshop, changing periods/pricing/status, replacing poster assets, or updating list/detail/order/payment behavior tied to one activity.
---

# Miniprogram Activity Rollout

## Goal
Keep one activity change consistent across listing, detail, order, utilities, and payment config.

## Workflow

### 1) Define activity contract first
- Confirm `activityId`, display title, city/age, price, period ids, enrollment status, and cover/poster paths.
- Decide activity archetype in detail page logic (winter/summer/weekend/future or new type).
- Confirm whether payment should be enabled (open enrollment) or display-only (closed archive).

### 2) Update shared source maps
- Update `miniprogram/utils/activities.ts` summary info.
- Update `miniprogram/utils/cloud-assets.ts` poster URL map (all referenced paths).
- If payable, update `cloudfunctions/paymentPrepare/index.js` `activityPaymentConfigMap` and allowed `periodIds`.

### 3) Update page-level wiring
- `miniprogram/pages/index/index.ts`: add card item, status/meta copy, and cover fallback.
- `miniprogram/pages/detail/detail.ts`: add config, tabs/media map, type flags, and hero/period metadata.
- `miniprogram/pages/detail/detail.wxml`: add/adjust tab sections and image bindings for the activity type.
- `miniprogram/pages/order-form/order-form.ts`: sync periods, fee map, and summary cover mapping.

### 4) Run consistency checks
- Grep by `activityId` and `periodId` to ensure no missing map entries:
  - `rg -n "<activity-id>|<period-id>" miniprogram cloudfunctions`
- Verify every poster path referenced in WXML/TS exists in `cloud-assets.ts`.
- Ensure `applyClosed` and index card status text are consistent.

### 5) Manual verification in DevTools
- From index page, tap the new/updated card and confirm detail content renders for all tabs.
- Click apply and confirm order page uses correct title, cover, periods, and price.
- If payment is enabled, run submit -> payment prepare and verify amount/period validation.
- Re-open my orders/detail pages to confirm summary text and status are correct.
