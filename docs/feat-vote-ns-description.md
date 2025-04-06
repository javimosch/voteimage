# Vote Namespace Description Feature Specification

## Overview
Enable admins to add and manage descriptions for vote namespaces to provide context about the voting purpose.

## Implementation Steps

### Frontend Changes (index.html)
1. Add description field to admin controls:
```html
<div class="mt-6 space-y-4">
  <h3 class="font-semibold text-lg" data-i18n="descriptionControls">Namespace Description</h3>
  <div>
    <label for="description-input" class="block text-sm font-medium text-gray-700 mb-1">
      <span data-i18n="descriptionLabel">Namespace Description:</span>
    </label>
    <textarea 
      id="description-input"
      class="w-full p-2 border border-gray-300 rounded h-32"
      data-i18n-placeholder="descriptionPlaceholder"
      placeholder="Describe this vote purpose..."
    ></textarea>
    <button 
      id="save-description-btn"
      class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      data-i18n="saveDescriptionBtn"
    >
      Save Description
    </button>
    <p id="description-status" class="mt-1 text-sm text-gray-600">
      <span data-i18n="characterCount">Characters:</span>
      <span id="character-count">0</span>/500
    </p>
  </div>
</div>
```

### Backend Changes (server.js)
1. Add description field to namespace schema:
```javascript
// In namespace data structure
{
  adminKey: string,
  description: string,
  // ...existing fields
}
```

2. Create description management endpoint:
```javascript
// POST /namespace/description - Update namespace description
app.post('/namespace/description', async (req, res) => {
  const { namespace, admin } = req.query;
  const { description } = req.body;

  if (!(await validateAdminKey(namespace, admin))) {
    return res.status(403).json({ message: 'Invalid admin key' });
  }

  if (description.length > 500) {
    return res.status(400).json({ message: 'Description exceeds 500 characters' });
  }

  const data = await readNamespaceData(namespace);
  data.description = description;
  await writeNamespaceData(namespace, data);

  res.json({ message: 'Description updated successfully' });
});
```

## Validation Requirements
1. Description must be:
   - Maximum 500 characters
   - Plain text (no HTML)
   - Editable only by namespace admins

## Display Logic
1. Show description in namespace info section:
```html
<div class="mb-4 p-4 bg-gray-50 rounded">
  <h3 class="font-semibold mb-2" data-i18n="namespaceDescription">Vote Purpose</h3>
  <p id="namespace-description-text" class="text-gray-700 whitespace-pre-wrap">
    {{description or 'No description provided'}}
  </p>
</div>
```

## Testing Plan
1. Verify description creation/editing flow
2. Test character limit enforcement
3. Validate admin access control
4. Check XSS prevention for special characters

## Documentation
1. Add description field to API documentation
2. Update admin guide with description management
3. Include in namespace metadata examples

## Localization
1. Add new i18n keys:
```json
{
  "descriptionControls": "Description Management",
  "descriptionLabel": "Namespace Description:",
  "descriptionPlaceholder": "Describe the purpose of this vote...",
  "saveDescriptionBtn": "Save Description",
  "characterCount": "Characters:",
  "namespaceDescription": "Voting Purpose"
}