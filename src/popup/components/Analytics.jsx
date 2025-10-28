import React, { useState, useEffect } from 'react';
import { getStatistics } from '../../utils/storage';

function Analytics() {
  const [stats, setStats] = useState({
    emailsProcessed: 0,
    draftsGenerated: 0,
    hoursSaved: 0,
    lastUpdated: Date.now()
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const statistics = await getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }

  function calculateAverageTime() {
    if (stats.emailsProcessed === 0) return 0;
    return ((stats.hoursSaved * 60) / stats.emailsProcessed).toFixed(1);
  }

  function calculateResponseRate() {
    if (stats.emailsProcessed === 0) return 0;
    return ((stats.draftsGenerated / stats.emailsProcessed) * 100).toFixed(0);
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

  return (
    <div className="space-y-4 fade-in">
      {/* Overview Stats */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-5 text-white">
        <h2 className="text-lg font-bold mb-4">Your Productivity Dashboard</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold">{stats.emailsProcessed}</div>
            <div className="text-sm text-primary-100">Emails Processed</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.draftsGenerated}</div>
            <div className="text-sm text-primary-100">Drafts Created</div>
          </div>
        </div>
      </div>

      {/* Time Saved */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Time Saved</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">
              {stats.hoursSaved.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {calculateAverageTime()}
            </div>
            <div className="text-sm text-gray-600">Min per Email</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Detailed Statistics</h3>
        <div className="space-y-3">
          <StatRow
            label="Response Rate"
            value={`${calculateResponseRate()}%`}
            description="Percentage of emails requiring response"
          />
          <StatRow
            label="Average Time Saved"
            value={`${calculateAverageTime()} min`}
            description="Per processed email"
          />
          <StatRow
            label="Total Processed"
            value={stats.emailsProcessed}
            description="All emails analyzed"
          />
          <StatRow
            label="Drafts Generated"
            value={stats.draftsGenerated}
            description="AI-powered responses"
          />
        </div>
      </div>

      {/* Time Breakdown */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Time Breakdown</h3>
        <div className="space-y-2">
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

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {formatDate(stats.lastUpdated)}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadStats}
        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow transition duration-200 text-sm"
      >
        Refresh Statistics
      </button>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          <strong>How we calculate:</strong> We estimate 2 minutes to read an email and
          3 minutes to draft a response. Your actual time saved may vary.
        </p>
      </div>
    </div>
  );
}

function StatRow({ label, value, description }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className="text-lg font-bold text-primary-600">{value}</div>
    </div>
  );
}

function TimeBreakdown({ label, minutes, color, bold = false }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };

  const hours = (minutes / 60).toFixed(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${bold ? 'font-bold' : 'font-medium'} text-gray-700`}>
          {label}
        </span>
        <span className={`text-xs ${bold ? 'font-bold' : ''} text-gray-600`}>
          {hours}h ({minutes.toFixed(0)}m)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min((minutes / 100) * 10, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default Analytics;
