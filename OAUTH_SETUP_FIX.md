# Fix OAuth Authentication - Complete Guide

## The Problem

You're getting error: `OAuth2 request failed: Service responded with error: 'bad client id: {0}'`

This happens because your OAuth client in Google Cloud Console is **NOT** configured as a **Chrome Extension** client.

## The Solution

### Step 1: Get Your Extension ID

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Find "AI Email Manager"
4. Copy the **Extension ID** (example: `abcdefghijklmnopqrstuvwxyz123456`)
   - It's a long string of random characters below the extension name

### Step 2: Delete Old OAuth Client (If Exists)

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your existing OAuth client ID
3. Click the trash icon to delete it
4. Confirm deletion

### Step 3: Create NEW Chrome Extension OAuth Client

1. Still in [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **CRITICAL**: For "Application type", select **"Chrome Extension"** (NOT "Web application")
4. Fill in the form:
   - **Name**: `AI Email Manager` (or any name you prefer)
   - **Application ID**: Paste your Extension ID from Step 1
5. Click **"CREATE"**
6. **Copy the Client ID** (format: `123456789-abc...def.apps.googleusercontent.com`)

### Step 4: Update manifest.json

Replace the client_id in your manifest:

```json
{
  "oauth2": {
    "client_id": "YOUR_NEW_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  }
}
```

### Step 5: Rebuild and Reload

```bash
cd /Users/gordonmeng/Desktop/2025/ai-email-manager
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Click the reload icon for "AI Email Manager"
3. Try signing in again

## Alternative: Check Your Current Setup

If you believe your OAuth client is already correct, verify:

1. **In Google Cloud Console**:
   - Go to Credentials
   - Click on your OAuth client
   - Verify "Application type" shows "Chrome Extension"
   - Verify "Application ID" matches your extension's ID exactly

2. **Extension ID Match**:
   - Chrome Extension ID: `chrome://extensions/` (get from here)
   - Google Cloud Console Application ID: Must be EXACTLY the same

## Still Not Working?

### Option 1: Use OAuth Consent Screen

If Chrome Extension client doesn't work, you can use a Web Application client:

1. Create OAuth client as **"Web application"**
2. Add authorized redirect URIs:
   ```
   https://<extension-id>.chromiumapp.org/
   ```
   Replace `<extension-id>` with your actual extension ID

3. Update manifest.json with the new web client ID

### Option 2: Alternative - Use API Key + OAuth Flow

Contact me if the above doesn't work, and we can implement a custom OAuth flow.

## Troubleshooting

### Error: "OAuth2 not granted or revoked"
- Clear Chrome extension data
- Revoke access at https://myaccount.google.com/permissions
- Try signing in again

### Error: "Access blocked: This app's request is invalid"
- Make sure Gmail API is enabled in Google Cloud Console
- Check that scopes in manifest match what's registered

### Error: Extension ID mismatch
- Extension ID in `chrome://extensions/` must EXACTLY match
- Application ID in Google Cloud Console OAuth client

