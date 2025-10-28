# Quick Start Guide - AI Email Manager

Get your AI Email Manager extension up and running in under 10 minutes!

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] Google account with Gmail
- [ ] Chrome browser
- [ ] OpenRouter API key (free tier available)

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd ai-email-manager
npm install
```

### 2. Build the Extension (1 minute)

```bash
npm run build
```

This creates a `dist` folder with your extension.

### 3. Load in Chrome (1 minute)

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist` folder
5. Copy the **Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### 4. Configure Google OAuth (3 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Gmail API**:
   - Navigate to: APIs & Services → Library
   - Search: "Gmail API"
   - Click Enable

4. Create OAuth credentials:
   - Go to: APIs & Services → Credentials
   - Click: Create Credentials → OAuth client ID
   - Application type: **Chrome Extension**
   - Application ID: Paste your Extension ID from Step 3
   - Name: "AI Email Manager"
   - Click Create

5. Copy the **Client ID** (format: `xxxxx.apps.googleusercontent.com`)

6. Update `public/manifest.json`:
   ```json
   {
     "oauth2": {
       "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
       ...
     }
   }
   ```

7. Rebuild and reload:
   ```bash
   npm run build
   ```
   Then reload the extension in Chrome.

### 5. Get API Keys (2 minutes)

**Required:**
- **OpenRouter** (for email classification):
  1. Sign up at [OpenRouter](https://openrouter.ai/)
  2. Go to Keys → Create new key
  3. Copy the API key (starts with `sk-or-`)

**Optional** (extension works without these):
- Summarizer API key
- Writer API key
- Rewriter API key
- Translator API key
- Proofreader API key

> **Note**: You can configure custom API endpoints in `src/config/apiConfig.js`

### 6. Configure Extension (1 minute)

1. Click the extension icon in Chrome
2. Click **Sign in with Google**
3. Grant Gmail permissions
4. Go to **Settings** tab
5. Enter your **OpenRouter API key**
6. (Optional) Enter other API keys
7. Adjust preferences:
   - ✅ Auto Sync Emails
   - ✅ Auto Apply Labels
   - ✅ Auto Generate Drafts
   - ✅ Enable Translation
8. Click **Save Settings**

### 7. Test It Out! (1 minute)

1. Go to **Dashboard** tab
2. Click **Sync Now**
3. Watch as your emails get processed!
4. Check the **Emails** tab to see categorized messages
5. View **Analytics** to see your productivity gains

## Troubleshooting

### "Authentication failed"
- Double-check Client ID in manifest.json
- Ensure Extension ID matches in Google Cloud
- Try signing out and back in

### "No emails found"
- Click "Sync Now" manually
- Check that you have unread emails
- Verify Gmail API is enabled

### "API key missing"
- At minimum, add OpenRouter API key in Settings
- Other APIs are optional and use fallbacks

## Icon Generation

Open `create-icons.html` in your browser to generate placeholder icons:
1. Open the file in Chrome
2. Icons will auto-generate
3. Right-click each → Save image as...
4. Save to `public/icons/` folder as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

Or create your own custom icons at these sizes!

## What Happens Next?

Once configured, the extension will:

1. **Every 60 seconds**: Check for new unread emails
2. **Automatically classify** each email into:
   - 📧 Notification
   - ✉️ Respond
   - 📣 Advertisement
3. **Apply Gmail labels** for easy filtering
4. **Generate draft replies** for emails that need responses
5. **Translate** drafts to match the original email's language
6. **Track statistics** on time saved

## Using the Extension

### Dashboard
- View processing statistics
- Manually trigger email sync
- See recent activity

### Emails Tab
- Filter by category
- View top emails in each category
- Click to open in Gmail

### Analytics
- See total emails processed
- Track drafts generated
- Calculate time saved
- View productivity metrics

### Settings
- Configure API keys
- Adjust preferences
- Set default reply tone
- Enable/disable features

## Next Steps

1. **Customize Tone**: Try different reply tones (Professional, Friendly, Concise)
2. **Check Labels**: Open Gmail and see your new auto-labels
3. **Review Drafts**: Check Gmail drafts folder for AI-generated replies
4. **Monitor Analytics**: Track your productivity improvements

## Need Help?

Check the full [README.md](README.md) for:
- Detailed architecture
- API configuration
- Advanced troubleshooting
- Development instructions

## Tips for Best Results

- **Keep API keys private** - Never share or commit them
- **Review AI-generated drafts** before sending
- **Adjust settings** to match your workflow
- **Monitor statistics** to see productivity gains
- **Customize tone** based on your communication style

---

**Enjoy your AI-powered email management!** 🚀
