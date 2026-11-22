# Security Specification – ALERT MFB HRMIS

## 1. Data Invariants
1. Every document in `employees`, `alertReviews`, `importLogs`, and `settings` belongs strictly to `orgId == 'alert_mfb'` (or `settingId == 'alert_mfb'`).
2. Users cannot self-assign elevated RBAC roles (`super_admin`, `hr_admin`, `hr_officer`) on account creation or update; only the bootstrapped Super Administrator (`chiksonroyalemart@gmail.com`, verified) or an existing active `super_admin` may assign roles or suspend accounts.
3. All write operations require `request.auth != null && request.auth.token.email_verified == true`.
4. All document IDs are validated against `^[a-zA-Z0-9_\-]+$` (`<= 128` chars) on single-document `get`, `create`, `update`, and `delete` operations.
5. `list` queries on `employees`, `alertReviews`, `importLogs`, and `users` enforce security directly against `resource.data` and `request.auth` with zero `get()` or `exists()` lookups inside `allow list`.
6. Read-only management users (`read_only`) can never create, update, or delete employees, settings, or alert reviews.
7. Server timestamps (`createdAt == request.time`, `updatedAt == request.time`) are strictly enforced on every create and update.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Employee Read**: `get /employees/emp_1` with `auth = null` -> DENIED.
2. **Unverified Email Employee Write**: `create /employees/emp_999` with `email_verified = false` -> DENIED.
3. **Privilege Escalation on Registration**: `create /users/uid_attacker` with `role: "super_admin"` by non-bootstrapped email -> DENIED.
4. **Self Role Upgrade on Update**: `update /users/uid_officer` changing `role` from `"hr_officer"` to `"super_admin"` -> DENIED.
5. **Shadow Field Injection on Employee**: `create /employees/emp_2` with extra ghost field `isSystemVerified: true` -> DENIED (`keys().hasOnly(...)`).
6. **ID Poisoning**: `create /employees/invalid|id$with*chars` -> DENIED (`isValidId`).
7. **Oversized String DoS**: `create /employees/emp_3` with `fullName` of 5,000 characters -> DENIED (`.size() <= 200`).
8. **Read-Only User Mutating Employee**: `update /employees/emp_1` by user with `role == "read_only"` -> DENIED.
9. **HR Officer Deleting Employee**: `delete /employees/emp_1` by user with `role == "hr_officer"` -> DENIED (only `super_admin` and `hr_admin` can delete).
10. **Client Timestamp Spoofing**: `create /employees/emp_4` with `createdAt` set to a past client timestamp instead of `request.time` -> DENIED.
11. **Immutable Field Mutation**: `update /employees/emp_1` changing `createdAt` or `orgId` -> DENIED.
12. **Blanket Employee List Scraping by Unauthorized External User**: `list /employees` by authenticated user not in `resource.data.authorizedUids` and not bootstrapped admin -> DENIED.
