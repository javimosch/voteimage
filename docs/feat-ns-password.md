# Namespace Password Protection Feature

## Overview

Optional password protection for namespaces to restrict access to voting and logo viewing. When enabled, users must enter the correct password to view or interact with the namespace.

## Feature Details

### Password Setup

- Optional feature enabled by admin
- Set during namespace creation or later via admin controls
- Password stored securely (hashed)
- Can be updated or removed by admin
- Minimum password requirements:
  - 6 characters minimum
  - No maximum length
  - Any characters allowed

### User Experience

1. **Accessing Protected Namespace**
   - User visits namespace URL
   - Presented with password entry screen
   - Cannot view logos or vote until correct password entered
   - Password valid for current browser session

2. **Password Entry**
   - Clean, simple interface
   - Error messages for incorrect attempts
   - No limit on attempts
   - "Remember me" option (30-day cookie)

### API Endpoints

```typescript
// Set/Update Password
POST /namespace/password
Query: namespace, admin
Body: { password: string | null }
Response: { message: string }

// Verify Password
POST /namespace/verify-password
Query: namespace
Body: { password: string, remember?: boolean }
Response: { 
  valid: boolean,
  token?: string, // JWT for session
  message: string 
}
```

### Security Considerations

1. **Password Storage**
   - Passwords hashed using bcrypt
   - Salt automatically generated
   - No plaintext storage

2. **Session Management**
   - JWT tokens for verified sessions
   - 24-hour expiry (session)
   - 30-day expiry (remember me)
   - Secure cookie flags

3. **Rate Limiting**
   - Per-IP rate limiting on verify endpoint
   - Exponential backoff for repeated failures

### Implementation Notes

1. **Database Changes**
```json
{
  "namespaceId": "...",
  "adminKey": "...",
  "passwordHash": null,  // Optional, bcrypt hash
  "passwordEnabled": false,
  // ... existing fields ...
}
```

2. **Frontend Changes**
   - Add password modal component
   - Add password toggle in admin controls
   - Update namespace initialization flow
   - Add session management
   - Add "protected" indicator to UI

3. **Backend Changes**
   - Add password endpoints
   - Add session verification middleware
   - Update existing endpoints to check protection
   - Add rate limiting middleware

### Error Handling

1. **API Errors**
   - 401: Invalid password
   - 403: Password required
   - 429: Too many attempts
   - 400: Invalid password format

2. **User Feedback**
   - Clear error messages
   - Password requirements shown
   - Session expiry warnings
   - Automatic re-authentication

## Testing Plan

1. **Unit Tests**
   - Password hashing
   - Token generation/validation
   - Rate limiting logic
   - Session management

2. **Integration Tests**
   - Password protection flow
   - Session persistence
   - Rate limiting behavior
   - Admin operations

3. **Manual Test Cases**
   - Enable/disable protection
   - Password update flow
   - Session expiry handling
   - Remember me functionality

## Future Enhancements

1. **Possible Extensions**
   - Multiple access levels
   - Temporary access codes
   - Password recovery options
   - Access logs for admins

2. **Performance Optimizations**
   - Cache verified sessions
   - Batch token validation
   - Distributed rate limiting

## Migration Plan

1. **Database Updates**
   - Add new fields (nullable)
   - No breaking changes
   - Default to unprotected

2. **API Version**
   - No version bump needed
   - Backward compatible
   - Progressive enhancement

## Documentation Updates

1. **Admin Guide**
   - Password best practices
   - Protection management
   - Session handling
   - Troubleshooting

2. **User Guide**
   - Accessing protected spaces
   - Session management
   - Browser compatibility
   - Common issues