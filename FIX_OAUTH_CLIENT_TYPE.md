# 🚨 CRITICAL: Wrong OAuth Client Type

## The Problem

Your credentials file shows:
```json
{"installed": {...}}
```

This means you created an **"Installed application"** or **"Desktop app"** OAuth client, which **DOES NOT WORK** with Chrome extensions!

### Why It Doesn't Work:

- ❌ **"Installed" apps** use `client_secret` (for desktop apps like Python scripts)
- ❌ **Chrome extensions** use `chrome.identity` API (no client_secret needed)
- ❌ They use completely different OAuth flows

### What You're Seeing:

Error: `OAuth2 request failed: Service responded with error: 'bad client id: {0}'`

This happens because Chrome's Identity API cannot use "installed" type credentials.

---

## ✅ The Solution: Create Correct OAuth Client Type

### Step 1: Delete the OLD OAuth Client

1. Go to: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find this client: `81855222951-mvbajo708rcutos03o75ro07u2v56lfq.apps.googleusercontent.com`
3. Click the **trash/delete icon** 🗑️
4. Confirm deletion

### Step 2: Get Your Extension ID

1. Open Chrome: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Find **"AI Email Manager"**
4. Copy the **Extension ID** (should look like: `abcdefghijklmnopqrstuvwxyz123456`)
   - It's a 32-character string below your extension name

**Write it down here:**
```
Extension ID: _________________________________
```

### Step 3: Create NEW Chrome Extension OAuth Client

1. Still in [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**

4. **CRITICAL STEP - Application Type:**
   
   You have TWO options:

   #### Option A: Chrome Extension (Recommended)
   - Select: **"Chrome Extension"**
   - Application ID: Paste your Extension ID from Step 2
   - Name: `AI Email Manager`
   - Click **CREATE**

   #### Option B: Web Application (If Option A not available)
   - Select: **"Web application"**
   - Name: `AI Email Manager Web`
   - Authorized JavaScript origins: Leave empty
   - Authorized redirect URIs: Add this:
     ```
     https://YOUR_EXTENSION_ID.chromiumapp.org/
     ```
     (Replace YOUR_EXTENSION_ID with your actual extension ID)
   - Click **CREATE**

5. **Copy the NEW Client ID**
   - Format: `123456789-xxxxxxxxx.apps.googleusercontent.com`
   - **NOTE:** You will NOT get a client_secret (Chrome extensions don't use it!)

### Step 4: Configure OAuth Consent Screen (IMPORTANT!)

1. Go to: [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

2. **User Type:**
   - Select **"External"** (if you want anyone to use it)
   - OR **"Internal"** (if using Google Workspace and only for your organization)
   - Click **CREATE**

3. **App information:**
   - App name: `AI Email Manager`
   - User support email: Your email
   - Developer contact: Your email
   - Click **SAVE AND CONTINUE**

4. **Scopes:**
   - Click **"ADD OR REMOVE SCOPES"**
   - Search and add these scopes:
     - ✅ `https://www.googleapis.com/auth/gmail.readonly`
     - ✅ `https://www.googleapis.com/auth/gmail.modify`
     - ✅ `https://www.googleapis.com/auth/gmail.labels`
     - ✅ `https://www.googleapis.com/auth/gmail.compose`
     - ✅ `https://www.googleapis.com/auth/userinfo.email`
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**

5. **Test users (IMPORTANT if app is in Testing mode):**
   - Click **"+ ADD USERS"**
   - Add YOUR Gmail address (the one you'll use to test)
   - Click **ADD**
   - Click **SAVE AND CONTINUE**

6. **Summary:**
   - Review and click **BACK TO DASHBOARD**

### Step 5: Update manifest.json

1. Open: `public/manifest.json`
2. Replace the client_id:

```json
{
  "oauth2": {
    "client_id": "YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com",
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

### Step 6: Rebuild and Reload

```bash
cd /Users/gordonmeng/Desktop/2025/ai-email-manager
npm run build
```

Then:
1. Go to `chrome://extensions/`
2. Find "AI Email Manager"
3. Click the **reload/refresh icon** ↻

### Step 7: Test Authentication

1. Click the extension icon
2. Click **"Sign in with Google"**
3. You should see the Google OAuth consent screen
4. Grant the requested permissions
5. Success! ✅

---

## 🔍 Verification Checklist

Before testing, verify:

- [ ] Old "installed" OAuth client is DELETED from Google Cloud Console
- [ ] New OAuth client is created (Chrome Extension OR Web Application type)
- [ ] Extension ID matches between Chrome and Google Cloud Console (if using Chrome Extension type)
- [ ] OR Redirect URI is correct: `https://EXTENSION_ID.chromiumapp.org/` (if using Web Application type)
- [ ] OAuth consent screen is configured
- [ ] All 5 Gmail scopes are added to OAuth consent screen
- [ ] Your Gmail address is added as a test user (if app is in Testing mode)
- [ ] manifest.json has the NEW client_id
- [ ] Extension is rebuilt and reloaded in Chrome

---

## 🆘 Still Having Issues?

### Error: "Access blocked: This app's request is invalid"
- Make sure all 5 scopes are added to OAuth consent screen
- Verify you're signed in with the Gmail address listed as a test user

### Error: "redirect_uri_mismatch"
- Your extension ID in Chrome must EXACTLY match the one in Google Cloud Console
- OR the redirect URI must be exactly: `https://EXTENSION_ID.chromiumapp.org/`

### Error: "unauthorized_client"
- Delete the old OAuth client completely
- Create a new one with the correct type

---

## 📝 Quick Reference

**Your Current Setup:**
- Client ID: `81855222951-mvbajo708rcutos03o75ro07u2v56lfq.apps.googleusercontent.com`
- Type: ❌ "installed" (WRONG - must delete)
- Project: `round-bounty-476402-k9`

**What You Need:**
- New Client ID: (to be created)
- Type: ✅ "Chrome Extension" OR "Web application"
- Project: Same (`round-bounty-476402-k9`)

**Key Difference:**
```
❌ OLD: {"installed": {"client_id": "...", "client_secret": "..."}}
✅ NEW: Just client_id in manifest.json (no client_secret for Chrome extensions!)
```

