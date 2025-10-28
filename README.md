# AI Email Manager - Chrome Extension

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A powerful Chrome Extension that uses AI to automatically organize and respond to your emails. Built with React, TailwindCSS, and integrated with multiple AI APIs for intelligent email processing.

## Features

- **Automatic Email Classification**: AI categorizes emails into Notification, Respond, or Advertisement
- **Smart Draft Generation**: Automatically creates professional reply drafts for actionable emails
- **Multi-Language Support**: Detects and translates emails to maintain language consistency
- **Gmail Integration**: Seamless integration with Gmail via OAuth 2.0
- **Time-Saving Analytics**: Track how much time you save with AI assistance
- **Customizable Settings**: Configure tone, auto-sync, and API preferences

## Architecture

```
Email Pipeline: Fetch → Summarize → Classify → Label → [Generate Draft → Rewrite → Translate → Proofread]
```

### Tech Stack

- **Frontend**: React 18, TailwindCSS
- **Build Tool**: Vite with @crxjs/vite-plugin
- **Chrome**: Manifest V3
- **APIs**: Gmail API, OpenRouter (Gemini 2.0), Summarizer, Writer, Rewriter, Translator, Proofreader

## Project Structure

```
ai-email-manager/
├── public/
│   ├── icons/                    # Extension icons (16x16, 48x48, 128x128)
│   └── manifest.json             # Chrome extension manifest
├── src/
│   ├── background/
│   │   └── background.js         # Service worker (email processing orchestrator)
│   ├── content/
│   │   └── content.js            # Gmail page injection script
│   ├── popup/
│   │   ├── App.jsx               # Main React app component
│   │   ├── main.jsx              # React entry point
│   │   ├── index.html            # Popup HTML
│   │   ├── index.css             # TailwindCSS imports
│   │   └── components/
│   │       ├── Dashboard.jsx     # Main dashboard with stats
│   │       ├── EmailList.jsx     # Categorized email list
│   │       ├── Settings.jsx      # API key & preference settings
│   │       └── Analytics.jsx     # Usage metrics & time saved
│   ├── services/
│   │   ├── gmailAPI.js           # Gmail API wrapper
│   │   ├── summarizeEmail.js     # Email summarization service
│   │   ├── classifyEmail.js      # AI classification (OpenRouter/Gemini)
│   │   ├── generateDraft.js      # Draft generation service
│   │   ├── rewriteDraft.js       # Draft polishing service
│   │   ├── translateDraft.js     # Translation service
│   │   └── proofreadDraft.js     # Proofreading service
│   ├── utils/
│   │   ├── storage.js            # Chrome storage helpers
│   │   ├── auth.js               # OAuth authentication
│   │   └── constants.js          # App constants
│   └── config/
│       └── apiConfig.js          # API endpoints configuration
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Google Chrome** browser
- **Google Cloud Project** with Gmail API enabled
- **API Keys** for AI services (at minimum, OpenRouter)

## Setup Instructions

### 1. Google Cloud Setup (OAuth Configuration)

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

#### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. **Application type**: Choose **"Chrome Extension"** (NOT "Web application")
4. **Name**: Give it a name (e.g., "AI Email Manager")
5. **Application ID**: You'll need your extension ID (see Step 3 below)
6. Add authorized scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.labels`
7. Click "Create" and copy the **Client ID**

#### Step 3: Get Extension ID

The first time you load the extension:
1. Build the extension (see below)
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder
6. Copy the **Extension ID** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

#### Step 4: Update OAuth Credentials

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Paste the Extension ID into the "Application ID" field
4. Save

#### Step 5: Update manifest.json

Open `public/manifest.json` and update:

```json
{
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels"
    ]
  }
}
```

### 2. Get API Keys

You'll need API keys for the AI services. At minimum, you need:

- **OpenRouter API Key** (required for email classification)
  - Sign up at [OpenRouter](https://openrouter.ai/)
  - The free Gemini 2.0 Flash Experimental model is used

Optional API keys (extension uses fallback if not provided):
- Summarizer API
- Writer API
- Rewriter API
- Translator API
- Proofreader API

> **Note**: If you don't have these APIs, you can use placeholder endpoints or implement your own services. The extension gracefully degrades functionality when APIs are unavailable.

### 3. Install Dependencies

```bash
cd ai-email-manager
npm install
```

### 4. Build the Extension

```bash
npm run build
```

This creates a `dist` folder with the compiled extension.

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `dist` folder from your project directory
5. The extension icon should appear in your toolbar

### 6. Configure the Extension

1. Click the extension icon in Chrome toolbar
2. Sign in with your Google account
3. Grant Gmail permissions
4. Go to **Settings** tab
5. Enter your API keys:
   - **OpenRouter API Key** (required)
   - Other API keys (optional)
6. Configure preferences:
   - Default tone (Professional/Friendly/Concise)
   - Auto-sync emails
   - Auto-apply labels
   - Auto-generate drafts
   - Enable translation
7. Click **Save Settings**

## Usage

### First-time Setup

1. **Sign in**: Click "Sign in with Google" in the extension popup
2. **Grant permissions**: Allow access to Gmail
3. **Configure API keys**: Go to Settings and add your API keys
4. **Sync emails**: Click "Sync Now" on the Dashboard

### Daily Usage

The extension works automatically in the background:

1. **Auto-sync**: Checks for new emails every 60 seconds
2. **Classification**: Each email is analyzed and categorized
3. **Labeling**: Gmail labels are automatically applied
4. **Draft generation**: For "Respond" emails, drafts are created automatically
5. **View results**: Open the popup to see statistics and email lists

### Email Categories

- **Notification**: Automated notifications, receipts, confirmations, newsletters
- **Respond**: Emails requiring personal response or action
- **Advertisement**: Marketing, promotional content, spam

### Dashboard Features

- **Sync Status**: See when emails were last synced
- **Statistics**: Emails processed, drafts generated, hours saved
- **Quick Actions**: Manual sync button
- **Category Overview**: View emails by category

### Email List

- Filter emails by category
- View top 5 emails in each category
- Click to open in Gmail
- Automatically refreshes with new classifications

### Analytics

- Total emails processed
- Total drafts generated
- Time saved calculations
- Response rate metrics
- Detailed breakdowns

## Development

### Run in Development Mode

```bash
npm run dev
```

This starts Vite dev server with hot module replacement.

### Build for Production

```bash
npm run build
```

### File Watching

The Vite dev server watches for changes and auto-reloads the extension.

## Troubleshooting

### Authentication Issues

**Problem**: "Authentication failed" error

**Solution**:
- Verify OAuth client ID is correct in `manifest.json`
- Ensure Extension ID matches in Google Cloud Console
- Check that Gmail API is enabled
- Try signing out and back in

### API Key Issues

**Problem**: "API key missing" warnings

**Solution**:
- Go to Settings tab
- Verify API keys are entered correctly
- At minimum, OpenRouter API key is required
- Other services will use fallback methods

### Extension Not Loading

**Problem**: Extension fails to load or shows errors

**Solution**:
- Run `npm run build` again
- Reload the extension in `chrome://extensions/`
- Check browser console for errors
- Verify all dependencies are installed

### Emails Not Processing

**Problem**: Emails aren't being classified or labeled

**Solution**:
- Check that auto-sync is enabled in Settings
- Click "Sync Now" manually
- Verify you're signed in with correct account
- Check background script logs (inspect service worker)

### Permission Denied

**Problem**: Gmail API returns 403 or 401 errors

**Solution**:
- Re-authenticate (sign out and sign in)
- Check OAuth scopes in manifest.json
- Verify Gmail API is enabled in Google Cloud
- Refresh OAuth token

## API Endpoints Configuration

The extension uses these API endpoints (configured in `src/config/apiConfig.js`):

```javascript
{
  GMAIL_BASE: 'https://www.googleapis.com/gmail/v1/users/me',
  OPENROUTER: 'https://openrouter.ai/api/v1/chat/completions',
  SUMMARIZER: 'https://api.example.com/summarize',    // Replace with actual
  WRITER: 'https://api.example.com/write',            // Replace with actual
  REWRITER: 'https://api.example.com/rewrite',        // Replace with actual
  TRANSLATOR: 'https://api.example.com/translate',    // Replace with actual
  PROOFREADER: 'https://api.example.com/proofread'    // Replace with actual
}
```

> **Note**: The placeholder URLs need to be replaced with your actual API endpoints. The extension will gracefully handle missing APIs with fallback behavior.

## Privacy & Security

- **Local Storage**: All API keys are stored locally in Chrome's secure storage
- **No Data Collection**: We don't collect or store any email data
- **OAuth Security**: Uses Google's official OAuth 2.0 flow
- **Permissions**: Only requests necessary Gmail permissions
- **Open Source**: Code is fully transparent and auditable

## Performance

- **Background Processing**: Runs in service worker, minimal impact
- **Efficient Polling**: 60-second intervals, configurable
- **Smart Caching**: Processes only new, unprocessed emails
- **Optimized Bundles**: Tree-shaking and code-splitting enabled

## Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review browser console logs
3. Inspect background service worker logs
4. Verify API configurations

## Future Enhancements

Potential improvements:
- [ ] Scheduled email sending
- [ ] Custom classification categories
- [ ] Email templates
- [ ] Bulk operations
- [ ] Advanced filtering rules
- [ ] Export email analytics
- [ ] Integration with other email providers
- [ ] Mobile companion app

## Credits

Built with:
- React 18
- TailwindCSS
- Vite
- Chrome Extension Manifest V3
- Gmail API
- OpenRouter (Gemini 2.0 Flash Experimental)

---

**Made with** ❤️ **and AI**

Last updated: 2025
