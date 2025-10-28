import React, { useState, useEffect } from 'react';
import {
  getCustomLabels,
  addCustomLabel,
  updateCustomLabel,
  deleteCustomLabel
} from '../../utils/storage';

function CustomLabels() {
  const [labels, setLabels] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', prompt: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', prompt: '' });

  useEffect(() => {
    loadLabels();
  }, []);

  async function loadLabels() {
    try {
      const customLabels = await getCustomLabels();
      setLabels(customLabels);
    } catch (error) {
      console.error('Failed to load custom labels:', error);
    }
  }

  async function handleAddLabel() {
    if (!newLabel.name.trim() || !newLabel.prompt.trim()) {
      alert('Please provide both a label name and a prompt template.');
      return;
    }

    try {
      await addCustomLabel({
        name: newLabel.name.trim(),
        prompt: newLabel.prompt.trim(),
        enabled: true
      });
      setNewLabel({ name: '', prompt: '' });
      setIsAddingNew(false);
      await loadLabels();
    } catch (error) {
      console.error('Failed to add custom label:', error);
      alert('Failed to add custom label. Please try again.');
    }
  }

  async function handleToggleEnabled(labelId, currentEnabled) {
    try {
      await updateCustomLabel(labelId, { enabled: !currentEnabled });
      await loadLabels();
    } catch (error) {
      console.error('Failed to toggle label:', error);
    }
  }

  async function handleDeleteLabel(labelId) {
    if (!confirm('Are you sure you want to delete this custom label?')) {
      return;
    }

    try {
      await deleteCustomLabel(labelId);
      await loadLabels();
    } catch (error) {
      console.error('Failed to delete label:', error);
      alert('Failed to delete label. Please try again.');
    }
  }

  function startEditing(label) {
    setEditingId(label.id);
    setEditData({ name: label.name, prompt: label.prompt });
  }

  async function handleSaveEdit(labelId) {
    if (!editData.name.trim() || !editData.prompt.trim()) {
      alert('Please provide both a label name and a prompt template.');
      return;
    }

    try {
      await updateCustomLabel(labelId, {
        name: editData.name.trim(),
        prompt: editData.prompt.trim()
      });
      setEditingId(null);
      await loadLabels();
    } catch (error) {
      console.error('Failed to update label:', error);
      alert('Failed to update label. Please try again.');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({ name: '', prompt: '' });
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Custom Labels</h2>
        <p className="text-sm text-gray-600 mb-4">
          Create custom classification labels with your own prompt templates. 
          Emails will be automatically checked against these custom criteria.
        </p>
        
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-sm"
        >
          {isAddingNew ? 'Cancel' : '+ Add New Label'}
        </button>
      </div>

      {/* Add New Label Form */}
      {isAddingNew && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">New Custom Label</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Label Name
              </label>
              <input
                type="text"
                value={newLabel.name}
                onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                placeholder="e.g., 'Client Inquiry', 'Partner Email'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Prompt Template
              </label>
              <textarea
                value={newLabel.prompt}
                onChange={(e) => setNewLabel({ ...newLabel, prompt: e.target.value })}
                placeholder="e.g., 'Emails from potential clients asking about services or products. Look for inquiries, questions about pricing, demo requests, or interest in collaboration.'"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe the criteria for this label. Be specific about what types of emails should match.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddLabel}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-sm"
              >
                Create Label
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewLabel({ name: '', prompt: '' });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Labels List */}
      <div className="space-y-3">
        {labels.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-4xl mb-2">🏷️</p>
            <p className="text-sm text-gray-600">No custom labels yet</p>
            <p className="text-xs text-gray-500 mt-1">Create your first custom label to get started</p>
          </div>
        ) : (
          labels.map((label) => (
            <div key={label.id} className="bg-white rounded-lg shadow p-4">
              {editingId === label.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Label Name
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Prompt Template
                    </label>
                    <textarea
                      value={editData.prompt}
                      onChange={(e) => setEditData({ ...editData, prompt: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(label.id)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-xs"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-3 rounded-lg transition duration-200 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">{label.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${label.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {label.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleEnabled(label.id, label.enabled)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        title={label.enabled ? 'Disable' : 'Enable'}
                      >
                        {label.enabled ? '⏸' : '▶️'}
                      </button>
                      <button
                        onClick={() => startEditing(label)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLabel(label.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{label.prompt}</p>
                  </div>

                  {label.createdAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(label.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Custom Labels</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Be specific and detailed in your prompt descriptions</li>
          <li>• Include examples of what should and shouldn't match</li>
          <li>• Use keywords and phrases that commonly appear in target emails</li>
          <li>• Test your labels by checking recent emails after creation</li>
          <li>• You can disable labels temporarily without deleting them</li>
        </ul>
      </div>
    </div>
  );
}

export default CustomLabels;

