# Vote Namespace Password Protection Feature Specification

## Overview
Enable admins to set passwords for vote namespaces to restrict access to authorized users only.

## Implementation Steps

### Frontend Changes (index.html)
1. Add password controls to admin section:
```html
<div class="mt-6 space-y-4">
  <h3 class="font-semibold text-lg" data-i18n="passwordControls">Password Protection</h3>
  <div>
    <label for="password-input" class="block text-sm font-medium text-gray-700 mb-1">
      <span data-i18n="passwordLabel">Set Password:</span>
    </label>
    <input 
      type="password"
      id="password-input"
      class="w-full p-2 border border-gray-300 rounded"
      data-i18n-placeholder="passwordPlaceholder"
      placeholder="Enter password..."
    >
    <button 
      id="set-password-btn"
      class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      data-i18n="setPasswordBtn"
    >
      Set Password
    </button>
    <p id="password-status" class="mt-1 text-sm text-gray-600">
      <span data-i18n="passwordStatus">Status:</span>
      <span id="password-status-text">Not set</span>
    </p>
  </div>
</div>
```

### Backend Changes (server.js)
1. Add password field to namespace schema:
```javascript
// In namespace data structure
{
  adminKey: string,
  password: string | null, // Hashed password
  // ...existing fields
}
```

2. Create password management endpoint:
```javascript
// POST /namespace/password - Set namespace password
app.post('/namespace/password', async (req, res) => {
  const { namespace, admin } = req.query;
  const { password } = req.body;

  if (!(await validateAdminKey(namespace, admin))) {
    return res.status(403).json({ message: 'Invalid admin key' });
  }

  const data = await readNamespaceData(namespace);
  data.password = password ? await bcrypt.hash(password, 10) : null;
  await writeNamespaceData(namespace, data);

  res.json({ message: 'Password updated successfully' });
});
```

3. Add password verification middleware:
```javascript
async function verifyNamespacePassword(namespaceId, password) {
  const data = await readNamespaceData(namespaceId);
  if (!data.password) return true; // No password set
  if (!password) return false;
  return await bcrypt.compare(password, data.password);
}
```

## Validation Requirements
1. Password must be:
   - Minimum 8 characters
   - Maximum 64 characters
   - Optional (can be cleared)
   - Stored hashed (bcrypt)

## Access Control Flow
1. If namespace has password:
   - Show password prompt modal
   - Store verified password in sessionStorage
   - Verify password on each request

## Testing Plan
1. Test password creation/removal
2. Verify password complexity requirements
3. Test session persistence
4. Validate brute force protection

## Documentation
1. Add password field to API docs
2. Update admin security guide
3. Include in namespace examples

## Localization
1. Add new i18n keys:
```json
{
  "passwordControls": "Password Protection",
  "passwordLabel": "Set Password:",
  "passwordPlaceholder": "Enter password...",
  "setPasswordBtn": "Set Password",
  "passwordStatus": "Status:",
  "passwordPrompt": "This namespace requires a password:",
  "passwordSubmit": "Submit",
  "passwordError": "Incorrect password"
}