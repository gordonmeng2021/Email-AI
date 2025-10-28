// Email classification categories
export const EMAIL_CATEGORIES = {
  NOTIFICATION: 'Notification',
  RESPOND: 'Respond',
  ADVERTISEMENT: 'Advertisement'
};

// Priority levels for emails
export const PRIORITY_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

// Gmail label colors
export const LABEL_COLORS = {
  [EMAIL_CATEGORIES.NOTIFICATION]: '#4285f4', // Blue
  [EMAIL_CATEGORIES.RESPOND]: '#ea4335',      // Red
  [EMAIL_CATEGORIES.ADVERTISEMENT]: '#fbbc04'  // Yellow
};

// Storage keys
export const STORAGE_KEYS = {
  API_KEYS: 'apiKeys',
  USER_EMAIL: 'userEmail',
  AUTH_TOKEN: 'authToken',
  LAST_SYNC: 'lastSync',
  SETTINGS: 'settings',
  STATISTICS: 'statistics',
  PROCESSED_EMAILS: 'processedEmails',
  EMAIL_PRIORITIES: 'emailPriorities',
  CUSTOM_LABELS: 'customLabels'
};

// API endpoints configuration keys
export const API_CONFIG_KEYS = {
  OPENROUTER: 'openrouterApiKey',
  SUMMARIZER: 'summarizerApiKey',
  WRITER: 'writerApiKey',
  REWRITER: 'rewriterApiKey',
  TRANSLATOR: 'translatorApiKey',
  PROOFREADER: 'proofreaderApiKey'
};

// Default settings
export const DEFAULT_SETTINGS = {
  autoSync: true,
  syncInterval: 60, // seconds
  defaultTone: 'professional', // professional, friendly, concise
  autoApplyLabels: true,
  autoDraft: true,
  enableTranslation: true
};

// Gmail API scopes
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Tone options for draft generation
export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' }
];

// Processing status
export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Error messages
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try logging in again.',
  API_KEY_MISSING: 'API key is missing. Please configure it in settings.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  RATE_LIMIT: 'API rate limit reached. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  SETTINGS_SAVED: 'Settings saved successfully!',
  EMAIL_PROCESSED: 'Email processed successfully!',
  SYNC_COMPLETED: 'Sync completed successfully!',
  DRAFT_CREATED: 'Draft created successfully!'
};
