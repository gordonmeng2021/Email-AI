# 📸 Step-by-Step Visual Guide - Fix OAuth Setup

## 🎯 Goal
Replace your "Installed application" OAuth client with a "Chrome Extension" OAuth client.

---

## 📋 PART 1: Delete Old OAuth Client

### Step 1.1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Make sure your project is selected: `round-bounty-476402-k9`

### Step 1.2: Find the Old Client
Look for:
```
OAuth 2.0 Client IDs
Name: [Some name]
Client ID: 81855222951-mvbajo708rcutos03o75ro07u2v56lfq.apps.googleusercontent.com
Type: Desktop app OR Installed application
```

### Step 1.3: Delete It
1. Click the **trash icon** 🗑️ on the right side of that row
2. Confirm deletion by clicking **DELETE**

✅ **Checkpoint:** The old client should be gone from the list

---

## 📋 PART 2: Get Chrome Extension ID

### Step 2.1: Open Chrome Extensions
1. Open a new tab in Chrome
2. Type in the address bar: `chrome://extensions/`
3. Press Enter

### Step 2.2: Enable Developer Mode
- Look in the **top-right corner**
- Find the toggle switch labeled **"Developer mode"**
- Make sure it's **ON** (blue)

### Step 2.3: Find Your Extension
- Scroll to find **"AI Email Manager"**
- Below the name, you'll see: **ID: [some long string]**
- Example: `abcdefghijklmnopqrstuvwxyz123456`

### Step 2.4: Copy the ID
- Select the entire ID string
- Copy it (Cmd+C on Mac, Ctrl+C on Windows)
- **IMPORTANT:** Write it down or keep it in your clipboard!

✅ **Checkpoint:** You have your Extension ID copied

---

## 📋 PART 3: Create New OAuth Client

### Step 3.1: Start Creation
1. Back in Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Click the blue button: **"+ CREATE CREDENTIALS"**
3. From the dropdown, select: **"OAuth client ID"**

### Step 3.2: Choose Application Type

**You will see a dropdown with these options:**
- Android
- Chrome app
- Chrome Extension ⬅️ **SELECT THIS**
- Desktop app (this is what you had before - don't use!)
- iOS
- TVs and Limited Input devices
- Universal Windows Platform
- Web application

**Select:** **"Chrome Extension"**

### Step 3.3: Fill in the Form

The form will show:
```
Application type: Chrome Extension

Name: [Enter a name]
▶ AI Email Manager

Application ID: [Paste your Extension ID here]
▶ [Paste the ID you copied in Step 2.4]
```

### Step 3.4: Create
1. Review your entries:
   - Application type: Chrome Extension ✓
   - Name: AI Email Manager ✓
   - Application ID: Your Extension ID ✓
2. Click the blue **"CREATE"** button

### Step 3.5: Copy New Client ID

A popup will appear:
```
OAuth client created

Your Client ID:
[new-numbers]-[random-string].apps.googleusercontent.com

Your Client Secret:
[This might be shown, but Chrome extensions don't use it - ignore it]
```

1. **Copy the Client ID** (the long string ending in .apps.googleusercontent.com)
2. Save it somewhere - you'll need it in Step 5
3. Click **OK** to close the popup

✅ **Checkpoint:** You have a NEW client ID (different from the old one)

---

## 📋 PART 4: Configure OAuth Consent Screen

### Step 4.1: Navigate to Consent Screen
1. In the left sidebar, click: **"OAuth consent screen"**
2. OR go directly to: https://console.cloud.google.com/apis/credentials/consent

### Step 4.2: Edit App Registration (If Already Created)
If you see your app already listed:
1. Click **"EDIT APP"**

If you see "User Type" selection:
1. Choose **"External"** (for testing with any Gmail account)
2. Click **"CREATE"**

### Step 4.3: App Information Page
Fill in:
```
App name: AI Email Manager
User support email: [Your email address]
App logo: [Optional - skip]
Application home page: [Optional - skip]
Application privacy policy link: [Optional - skip]
Application terms of service link: [Optional - skip]
Authorized domains: [Skip]
Developer contact information: [Your email address]
```

Click **"SAVE AND CONTINUE"**

### Step 4.4: Scopes Page (CRITICAL!)

1. Click **"ADD OR REMOVE SCOPES"**
2. A panel will slide in from the right
3. In the filter box at the top, type: `gmail`
4. You'll see many Gmail scopes listed
5. **Check these boxes** (scroll down to find them all):

   ```
   ✅ .../auth/gmail.readonly
      Read all resources and their metadata—no write operations.
   
   ✅ .../auth/gmail.modify
      All read/write operations except immediate, permanent deletion of threads and messages.
   
   ✅ .../auth/gmail.labels
      Manage mailbox labels
   
   ✅ .../auth/gmail.compose
      Manage drafts and send emails
   ```

6. In the filter box, type: `userinfo`
7. **Check this box:**
   ```
   ✅ .../auth/userinfo.email
      See your primary Google Account email address
   ```

8. Scroll to the bottom of the panel
9. Click **"UPDATE"**
10. You should see 5 scopes listed on the main page
11. Click **"SAVE AND CONTINUE"**

### Step 4.5: Test Users Page (IMPORTANT!)

**If your app is in "Testing" status** (not published):
1. Click **"+ ADD USERS"**
2. Enter your Gmail address (the one you'll use to test)
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

**Why this matters:** Only test users can sign in when app is in testing mode!

### Step 4.6: Summary Page
1. Review everything
2. Click **"BACK TO DASHBOARD"**

✅ **Checkpoint:** OAuth consent screen is fully configured

---

## 📋 PART 5: Update Your Code

### Step 5.1: Open manifest.json
```bash
cd /Users/gordonmeng/Desktop/2025/ai-email-manager
open public/manifest.json
```

### Step 5.2: Replace Client ID
Find this section:
```json
"oauth2": {
  "client_id": "81855222951-mvbajo708rcutos03o75ro07u2v56lfq.apps.googleusercontent.com",
```

Replace with your NEW client ID from Step 3.5:
```json
"oauth2": {
  "client_id": "YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com",
```

**IMPORTANT:** 
- ✅ Keep the quotes around the client ID
- ✅ No http:// or https:// prefix
- ✅ No trailing slash /
- ✅ Should end with .apps.googleusercontent.com

### Step 5.3: Verify Scopes
Make sure your manifest has all 5 scopes:
```json
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
```

### Step 5.4: Save the File
- Press Cmd+S (Mac) or Ctrl+S (Windows)
- Close the editor

---

## 📋 PART 6: Rebuild and Test

### Step 6.1: Rebuild Extension
Open Terminal and run:
```bash
cd /Users/gordonmeng/Desktop/2025/ai-email-manager
npm run build
```

Wait for: `✓ built in XXXms`

### Step 6.2: Reload Extension in Chrome
1. Go to: `chrome://extensions/`
2. Find "AI Email Manager"
3. Click the **circular reload icon** ↻
4. The extension should reload (you might see it disable/enable briefly)

### Step 6.3: Test Authentication
1. Click the **extension icon** in Chrome toolbar (puzzle piece icon)
2. Find "AI Email Manager" and click it
3. The popup should open
4. Click **"Sign in with Google"** button
5. A new window should open with Google's sign-in page

### Step 6.4: Expected Flow

**If everything is correct:**
1. Google OAuth page opens ✅
2. Shows: "AI Email Manager wants to access your Google Account"
3. Shows the 5 Gmail scopes (read, modify, labels, compose, email)
4. Click **"Allow"** or **"Continue"**
5. Window closes automatically
6. Extension popup shows your email address
7. You're signed in! 🎉

**If you see an error:**
- See troubleshooting section below

---

## 🆘 TROUBLESHOOTING

### Error: "Access blocked: This app's request is invalid"

**Causes:**
- OAuth consent screen is not configured
- Scopes are missing from consent screen
- Your email is not added as test user

**Fix:**
1. Go back to PART 4
2. Make sure all 5 scopes are added
3. Add your email as test user

### Error: "redirect_uri_mismatch"

**Causes:**
- Extension ID mismatch between Chrome and Google Cloud Console

**Fix:**
1. Go to `chrome://extensions/`
2. Copy your Extension ID again
3. Go to Google Cloud Console → Credentials
4. Click on your OAuth client
5. Verify "Application ID" matches EXACTLY

### Error: "OAuth2 not granted or revoked"

**Fix:**
1. Go to: https://myaccount.google.com/permissions
2. Find "AI Email Manager"
3. Click "Remove access"
4. Try signing in again

### Error: Still getting "bad client id" error

**Fix:**
1. Make sure you DELETED the old "installed" OAuth client
2. Created a NEW "Chrome Extension" OAuth client
3. Updated manifest.json with the NEW client ID
4. Rebuilt with `npm run build`
5. Reloaded extension in Chrome

---

## ✅ FINAL CHECKLIST

Before testing, confirm:

- [x] Old OAuth client (installed type) is **DELETED**
- [x] New OAuth client (Chrome Extension type) is **CREATED**
- [x] Extension ID in Chrome **MATCHES** Application ID in Google Cloud Console
- [x] OAuth consent screen has **ALL 5 SCOPES**
- [x] Your Gmail is added as **TEST USER**
- [x] manifest.json has **NEW CLIENT ID**
- [x] Extension is **REBUILT** (`npm run build`)
- [x] Extension is **RELOADED** in Chrome

If all checked, authentication WILL work! 🎉

