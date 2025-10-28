import React, { useState, useEffect } from 'react';
import { getApiKeys, saveApiKeys, getSettings, saveSettings } from '../../utils/storage';
import { API_CONFIG_KEYS, TONE_OPTIONS, SUCCESS_MESSAGES } from '../../utils/constants';

function Settings() {
  const [apiKeys, setApiKeys] = useState({
    [API_CONFIG_KEYS.OPENROUTER]: '',
    [API_CONFIG_KEYS.SUMMARIZER]: '',
    [API_CONFIG_KEYS.WRITER]: '',
    [API_CONFIG_KEYS.REWRITER]: '',
    [API_CONFIG_KEYS.TRANSLATOR]: '',
    [API_CONFIG_KEYS.PROOFREADER]: ''
  });

  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 60,
    defaultTone: 'professional',
    autoApplyLabels: true,
    autoDraft: true,
    enableTranslation: true
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const keys = await getApiKeys();
      const userSettings = await getSettings();

      setApiKeys(keys);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      await saveApiKeys(apiKeys);
      await saveSettings(settings);

      setMessage(SUCCESS_MESSAGES.SETTINGS_SAVED);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function updateApiKey(key, value) {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  }

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4 fade-in max-h-[500px] overflow-y-auto">
      {/* Success Message */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* API Keys Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3">API Keys</h2>
        <div className="space-y-3">
          <ApiKeyInput
            label="OpenRouter API Key"
            value={apiKeys[API_CONFIG_KEYS.OPENROUTER]}
            onChange={(value) => updateApiKey(API_CONFIG_KEYS.OPENROUTER, value)}
            placeholder="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"
            required
          />
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3">General Settings</h2>
        <div className="space-y-3">
          <ToggleSetting
            label="Auto Sync Emails"
            description="Automatically check for new emails"
            checked={settings.autoSync}
            onChange={(value) => updateSetting('autoSync', value)}
          />

          <ToggleSetting
            label="Auto Apply Labels"
            description="Automatically label classified emails"
            checked={settings.autoApplyLabels}
            onChange={(value) => updateSetting('autoApplyLabels', value)}
          />

          <ToggleSetting
            label="Auto Generate Drafts"
            description="Automatically create draft replies"
            checked={settings.autoDraft}
            onChange={(value) => updateSetting('autoDraft', value)}
          />

          <ToggleSetting
            label="Enable Translation"
            description="Translate drafts to match email language"
            checked={settings.enableTranslation}
            onChange={(value) => updateSetting('enableTranslation', value)}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Default Reply Tone
            </label>
            <select
              value={settings.defaultTone}
              onChange={(e) => updateSetting('defaultTone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TONE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full font-semibold py-3 px-4 rounded-lg transition duration-200 ${
          saving
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
        }`}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> OpenRouter API key is required for email classification.
          Other API keys are optional - the extension will use fallback methods if not provided.
        </p>
      </div>
    </div>
  );
}

function ApiKeyInput({ label, value, onChange, placeholder, required = false }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showKey ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default Settings;
