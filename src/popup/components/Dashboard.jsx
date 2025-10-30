import React, { useState, useEffect } from 'react';
import { getStatistics, getStorage, setStorage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';

function Dashboard() {
  const [stats, setStats] = useState({
    emailsProcessed: 0,
    draftsGenerated: 0,
    hoursSaved: 0,
    lastUpdated: Date.now()
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

  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function calculateAverageTime() {
    if (stats.emailsProcessed === 0) return 0;
    return ((stats.hoursSaved * 60) / stats.emailsProcessed).toFixed(1);
  }

  function calculateResponseRate() {
    if (stats.emailsProcessed === 0) return 0;
    return ((stats.draftsGenerated / stats.emailsProcessed) * 100).toFixed(0);
  }

  return (
    <div className="space-y-5 fade-in max-w-4xl mx-auto">
      {/* Hero Stats Card with Gradient */}
      <div className="bg-gradient-to-br from-blue-500 via-primary-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold mb-1">Productivity Dashboard</h2>
            <p className="text-sm text-blue-100 opacity-90">Track your email efficiency</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
              syncing
                ? 'bg-white/30 cursor-not-allowed'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            {syncing ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⟳</span>
                Syncing...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="mr-2">🔄</span>
                Sync Now
              </span>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-4xl font-bold mb-1">{stats.emailsProcessed}</div>
            <div className="text-sm text-blue-100">Emails Processed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-4xl font-bold mb-1">{stats.draftsGenerated}</div>
            <div className="text-sm text-blue-100">Drafts Created</div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-blue-100 opacity-75">
          Last sync: {formatTimeAgo(lastSync)}
        </div>
      </div>

      {/* Time Saved Highlight */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
            <span className="text-2xl">⏱️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Time Saved</h3>
            <p className="text-sm text-gray-500">Your productivity gains</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.hoursSaved.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {calculateAverageTime()}m
            </div>
            <div className="text-sm text-gray-600">Per Email</div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Detailed Statistics
        </h3>
        <div className="space-y-4">
          <StatRow
            icon="📈"
            label="Response Rate"
            value={`${calculateResponseRate()}%`}
            description="Emails requiring response"
            color="blue"
          />
          <StatRow
            icon="⚡"
            label="Average Time Saved"
            value={`${calculateAverageTime()} min`}
            description="Per processed email"
            color="yellow"
          />
          <StatRow
            icon="📧"
            label="Total Processed"
            value={stats.emailsProcessed}
            description="All emails analyzed"
            color="purple"
          />
          <StatRow
            icon="✍️"
            label="Drafts Generated"
            value={stats.draftsGenerated}
            description="AI-powered responses"
            color="green"
          />
        </div>
      </div>

      {/* Time Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">⏰</span>
          Time Breakdown
        </h3>
        <div className="space-y-4">
          <TimeBreakdown
            label="Reading & Understanding"
            minutes={stats.emailsProcessed * 2}
            color="blue"
          />
          <TimeBreakdown
            label="Drafting Responses"
            minutes={stats.draftsGenerated * 3}
            color="green"
          />
          <TimeBreakdown
            label="Total Time Saved"
            minutes={stats.hoursSaved * 60}
            color="purple"
            bold
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">How we calculate</p>
              <p className="text-xs text-amber-800">
                We estimate 2 minutes to read an email and 3 minutes to draft a response. 
                Your actual time saved may vary based on email complexity.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">📅</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">Last Updated</p>
              <p className="text-xs text-blue-800">{formatDate(stats.lastUpdated)}</p>
            </div>
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, description, color }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  );
}

function TimeBreakdown({ label, minutes, color, bold = false }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };

  const bgColorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50'
  };

  const hours = (minutes / 60).toFixed(1);
  const percentage = Math.min((minutes / 100) * 10, 100);

  return (
    <div className={`${bold ? bgColorClasses[color] : ''} rounded-xl p-3 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} text-gray-700`}>
          {label}
        </span>
        <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} text-gray-600`}>
          {hours}h ({minutes.toFixed(0)}m)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${colorClasses[color]} h-3 rounded-full transition-all duration-500 shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
