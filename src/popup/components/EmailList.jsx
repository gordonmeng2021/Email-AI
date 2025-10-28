import React, { useState, useEffect } from 'react';
import { getEmailsByLabel, fetchEmailDetails } from '../../services/gmailAPI';
import { getEmailPriority, setEmailPriority } from '../../utils/storage';
import { prioritizeEmail } from '../../services/prioritizeEmail';
import { summarizeEmail } from '../../services/summarizeEmail';
import { EMAIL_CATEGORIES, PRIORITY_LEVELS } from '../../utils/constants';

function EmailList() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(EMAIL_CATEGORIES.RESPOND);

  useEffect(() => {
    loadEmails();
  }, [selectedCategory]);

  async function loadEmails() {
    setLoading(true);
    try {
      const fetchedEmails = await getEmailsByLabel(selectedCategory, 5);
      
      // Load and generate priorities for "Respond" emails
      if (selectedCategory === EMAIL_CATEGORIES.RESPOND) {
        const emailsWithPriorities = await Promise.all(
          fetchedEmails.map(async (email) => {
            // Check if priority is already cached
            let priorityData = await getEmailPriority(email.id);
            
            // If not cached, generate priority on-demand
            if (!priorityData) {
              console.log(`Generating priority for email ${email.id}...`);
              try {
                // Summarize email content first if needed
                const summary = email.snippet || email.body?.substring(0, 500) || '';
                
                // Generate priority
                priorityData = await prioritizeEmail(summary, {
                  subject: email.subject,
                  from: email.from,
                  date: email.date
                });
                
                // Cache the priority for next time
                await setEmailPriority(email.id, priorityData);
                console.log(`Priority cached: ${priorityData.priority}`);
              } catch (error) {
                console.error(`Failed to generate priority for email ${email.id}:`, error);
                priorityData = { priority: null, reasoning: 'Priority generation failed' };
              }
            }
            
            return {
              ...email,
              priority: priorityData?.priority || null,
              priorityReasoning: priorityData?.reasoning || null
            };
          })
        );
        setEmails(emailsWithPriorities);
      } else {
        setEmails(fetchedEmails);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }

  function truncate(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  function extractSenderName(from) {
    if (!from) return 'Unknown';
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : from;
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-3">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={EMAIL_CATEGORIES.RESPOND}>Respond</option>
          <option value={EMAIL_CATEGORIES.NOTIFICATION}>Notification</option>
          <option value={EMAIL_CATEGORIES.ADVERTISEMENT}>Advertisement</option>
        </select>
      </div>

      {/* Email List */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm text-gray-600">No emails in this category</p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailCard key={email.id} email={email} />
          ))
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadEmails}
        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow transition duration-200 text-sm"
      >
        Refresh
      </button>
    </div>
  );
}

function EmailCard({ email }) {
  function truncate(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  function extractSenderName(from) {
    if (!from) return 'Unknown';
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : from;
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return `${diffDays}d ago`;
      }
    } catch {
      return dateString;
    }
  }

  function getPriorityBadgeStyle(priority) {
    switch (priority) {
      case PRIORITY_LEVELS.HIGH:
        return 'bg-red-100 text-red-800 border-red-400';
      case PRIORITY_LEVELS.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case PRIORITY_LEVELS.LOW:
        return 'bg-green-100 text-green-800 border-green-400';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  function openInGmail() {
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
    chrome.tabs.create({ url: gmailUrl });
  }

  return (
    <div
      onClick={openInGmail}
      className="bg-white rounded-lg shadow p-3 hover:shadow-md transition duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {email.subject || '(No subject)'}
            </h3>
            {email.priority && (
              <span 
                className={`text-xs px-2 py-0.5 rounded border ${getPriorityBadgeStyle(email.priority)} flex-shrink-0`}
                title={email.priorityReasoning}
              >
                {email.priority}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            {extractSenderName(email.from)}
          </p>
        </div>
        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
          {formatDate(email.date)}
        </span>
      </div>

      <p className="text-xs text-gray-600 line-clamp-2">
        {email.snippet || truncate(email.body, 100)}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-primary-600 font-medium hover:underline">
          Open in Gmail →
        </span>
      </div>
    </div>
  );
}

export default EmailList;
