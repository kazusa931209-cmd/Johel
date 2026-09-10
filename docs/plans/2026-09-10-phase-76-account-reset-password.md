# Phase 76 — Account page and reset password

**Performed:** 2026-09-10  
**Status:** Finished

## Goal

Rename the header user-menu **Profile** item to **Account**, move the route from `/profile` to `/account`, and add **Reset Password** on that page (current password + new password). Workspace **Profiles** is unchanged.

## Product

- Header dropdown: **Account**, **Sign out**
- `/account` shows Login ID and a Reset Password form
- `/profile` redirects to `/account`

## Technical

- `PUT /auth/password` — `{ currentPassword, newPassword }`; verifies current hash, writes new hash only
- Web: `changePassword` in `api.ts`; Account page uses existing form validation + toast rules
