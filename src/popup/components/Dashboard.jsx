import React, { useState, useEffect } from 'react';
import { getStatistics, getStorage, setStorage } from '../../utils/storage';
import { EMAIL_CATEGORIES, STORAGE_KEYS } from '../../utils/constants';

function Dashboard() {
  const [stats, setStats] = useState({
    emailsProcessed: 0,
    draftsGenerated: 0,
    hoursSaved: 0
  });
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
    loadLastSync();
  }, []);

  async function loadStats() {
    try {
      const statistics = await getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }

  async function loadLastSync() {
    try {
      const result = await getStorage(STORAGE_KEYS.LAST_SYNC);
      const timestamp = result[STORAGE_KEYS.LAST_SYNC];
      if (timestamp) {
        setLastSync(new Date(timestamp));
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      // Send message to background script to sync emails
      chrome.runtime.sendMessage({ type: 'SYNC_EMAILS' }, async (response) => {
        if (response?.success) {
          const now = new Date();
          setLastSync(now);
          // Save timestamp to storage
          await setStorage({ [STORAGE_KEYS.LAST_SYNC]: now.getTime() });
          loadStats();
        }
      });

      // Reset syncing state after delay
      setTimeout(() => {
        setSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncing(false);
    }
  }

  function formatTimeAgo(date) {
    if (!date) return 'Never';

    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Sync Button */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Email Sync</h2>
            <p className="text-xs text-gray-500">Last sync: {formatTimeAgo(lastSync)}</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-4 py-2 rounded-lg font-medium text-white transition duration-200 ${
              syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {syncing ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⟳</span>
                Syncing...
              </span>
            ) : (
              'Sync Now'
            )}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Emails"
          value={stats.emailsProcessed}
          icon="📧"
          color="blue"
        />
        <StatCard
          title="Drafts"
          value={stats.draftsGenerated}
          icon="✍️"
          color="green"
        />
        <StatCard
          title="Hours Saved"
          value={stats.hoursSaved.toFixed(1)}
          icon="⏱️"
          color="purple"
        />
      </div>

      {/* Quick Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">How it works</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <Step number="1" text="Extension checks for new emails every minute" />
          <Step number="2" text="AI classifies emails into categories" />
          <Step number="3" text="Labels are automatically applied in Gmail" />
          <Step number="4" text="Draft replies generated for actionable emails" />
        </div>
      </div>

      {/* Email Categories */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Email Categories</h3>
        <div className="space-y-2">
          <CategoryBadge
            name={EMAIL_CATEGORIES.NOTIFICATION}
            color="blue"
            description="Automated notifications & receipts"
          />
          <CategoryBadge
            name={EMAIL_CATEGORIES.RESPOND}
            color="red"
            description="Emails requiring response"
          />
          <CategoryBadge
            name={EMAIL_CATEGORIES.ADVERTISEMENT}
            color="yellow"
            description="Marketing & promotional emails"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium">{title}</div>
    </div>
  );
}

function Step({ number, text }) {
  return (
    <div className="flex items-start">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold mr-2">
        {number}
      </span>
      <span>{text}</span>
    </div>
  );
}

function CategoryBadge({ name, color, description }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="flex items-center justify-between">
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClasses[color]}`}>
        {name}
      </span>
      <span className="text-xs text-gray-500">{description}</span>
    </div>
  );
}

export default Dashboard;
