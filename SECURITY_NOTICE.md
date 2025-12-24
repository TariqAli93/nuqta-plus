# Security Notice: Frontend-Only Authorization

## ⚠️ IMPORTANT WARNING

This application uses **frontend-only authorization**. This means:

1. **Backend does NOT enforce authorization** - All endpoints are accessible to any authenticated user (valid token)
2. **Security is handled entirely in the frontend** - UI elements are hidden based on user role
3. **Anyone with a valid token can call any API endpoint directly** - Bypassing UI restrictions

## When This Is Acceptable

This approach is suitable ONLY for:
- Single-machine offline applications
- Trusted environments where all users are trusted
- Development/testing environments
- Applications where security is not a concern

## When This Is NOT Acceptable

Do NOT use this approach for:
- Multi-user systems
- Internet-facing applications
- Applications handling sensitive data
- Production environments with untrusted users
- Any scenario where security matters

## Current Implementation

- **Authentication**: Backend verifies JWT tokens (valid/invalid/expired)
- **Authorization**: Frontend-only via UI hiding based on `user.role`
- **Roles**: `admin`, `manager`, `cashier`, `viewer`

## How It Works

1. User logs in → receives JWT token
2. Frontend checks `user.role` from token/profile
3. UI elements are shown/hidden based on role using `frontend/src/auth/uiAccess.js`
4. Backend accepts all requests from authenticated users (no role checks)

## Testing Security

To verify the security model:
1. Login as a `viewer` role
2. Open browser DevTools → Network tab
3. Try to call admin endpoints directly (e.g., `POST /api/users`)
4. **Expected**: Request succeeds (this confirms frontend-only security)

## Recommendations

If you need backend security:
1. Re-enable `authorize()` middleware in routes
2. Use the permission matrix from `backend/src/auth/permissionMatrix.js`
3. Keep frontend UI hiding as a UX enhancement, not security

---

**Last Updated**: After removing backend authorization enforcement

