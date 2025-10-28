# Alternative Authentication Setup - Web Application OAuth

If the Chrome Extension OAuth client doesn't work, you can use a Web Application OAuth client with redirect URIs.

## Step-by-Step Setup

### Step 1: Get Your Extension ID

1. Open `chrome://extensions/`
2. Find "AI Email Manager"
3. Copy the Extension ID (example: `abcdefghijklmnopqrstuvwxyz123456`)

### Step 2: Create Web Application OAuth Client

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type**: Select **"Web application"**
4. **Name**: `AI Email Manager Web`
5. **Authorized JavaScript origins**: Leave empty
6. **Authorized redirect URIs**: Add these URIs:
   ```
   https://<YOUR-EXTENSION-ID>.chromiumapp.org/
   https://<YOUR-EXTENSION-ID>.chromiumapp.org/callback
   ```
   Replace `<YOUR-EXTENSION-ID>` with your actual extension ID from Step 1

7. Click **"CREATE"**
8. Copy the **Client ID**

### Step 3: Update manifest.json

The manifest format stays the same - just use the new Client ID:

```json
{
  "oauth2": {
    "client_id": "YOUR_NEW_WEB_CLIENT_ID.apps.googleusercontent.com",
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

### Step 4: Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Make sure these settings are correct:
   - **User Type**: External (or Internal if using Google Workspace)
   - **Application name**: AI Email Manager
   - **User support email**: Your email
   - **Developer contact**: Your email
3. Under **Scopes**, click "ADD OR REMOVE SCOPES" and add:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/userinfo.email`
4. Under **Test users** (if app is in testing mode):
   - Add your Gmail address as a test user
5. Save

### Step 5: Rebuild and Test

```bash
npm run build
```

Then reload the extension in Chrome and try signing in.

## Important Notes

1. **Extension ID Must Match**: The redirect URI must use your exact extension ID
2. **HTTPS Required**: Chrome extension URIs automatically use HTTPS
3. **Testing Mode**: If your app is in testing mode, only test users can sign in
4. **Publishing**: To allow anyone to sign in, you need to publish the OAuth consent screen (requires verification for sensitive scopes)

## Quick Check Script

Add your extension ID and client ID below to verify the format:

```
Extension ID: ____________________________
Expected Redirect URI: https://______________________________.chromiumapp.org/
Client ID: ______________________________.apps.googleusercontent.com
```

Make sure:
- ✅ Extension ID has no spaces or special characters
- ✅ Redirect URI uses `.chromiumapp.org` domain
- ✅ Client ID ends with `.apps.googleusercontent.com`

