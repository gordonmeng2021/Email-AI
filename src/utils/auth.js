import { GMAIL_SCOPES, STORAGE_KEYS } from './constants.js';
import { setStorage, getStorage, removeStorage } from './storage.js';

/**
 * Authentication utility module
 * Handles OAuth 2.0 authentication with Gmail using Chrome Identity API
 */

/**
 * Get OAuth token from Chrome Identity API
 * @param {boolean} interactive - Whether to show interactive login prompt
 * @returns {Promise<string>} OAuth token
 */
export async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        // Extract error message from Chrome runtime error object
        console.log("Error in getAuthToken",token);
        const errorMessage = chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError);
      
        console.log('Error message:', errorMessage);
        reject(new Error(errorMessage));
      } else if (!token) {
        console.log('No token received');
        reject(new Error('No token received'));
      } else {
        console.log('Token received:', token);
        resolve(token);
      }
    });
  });
}

/**
 * Remove cached OAuth token
 * @param {string} token - Token to remove
 * @returns {Promise<void>}
 */
export async function removeCachedToken(token) {
  return new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        // Extract error message from Chrome runtime error object
        const errorMessage = chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError);
        reject(new Error(errorMessage));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Sign in user and get OAuth token
 * @returns {Promise<{token: string, email: string}>}
 */
export async function signIn() {
  try {
    // Get OAuth token with interactive prompt
    console.log('Getting auth token...');
    const token = await getAuthToken(true);
    console.log('Auth token received:', token);
    // Store token in Chrome storage
    console.log('Storing token in Chrome storage...');
    await setStorage({ [STORAGE_KEYS.AUTH_TOKEN]: token });
    console.log('Token stored in Chrome storage');

    // Get user email from token info
    console.log('Getting user email...');
    const email = await getUserEmail(token);
    console.log('User email received:', email);
    console.log('Storing user email in Chrome storage...');
    await setStorage({ [STORAGE_KEYS.USER_EMAIL]: email });
    console.log('User email stored in Chrome storage');

    return { token, email };
  } catch (error) {
    console.error('Sign in failed:', error);
    throw new Error('Authentication failed. Please try again.');
  }
}

/**
 * Sign out user and clear tokens
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    // Get current token
    const result = await getStorage(STORAGE_KEYS.AUTH_TOKEN);
    const token = result[STORAGE_KEYS.AUTH_TOKEN];

    if (token) {
      // Remove cached token from Chrome Identity
      await removeCachedToken(token);
    }

    // Clear auth data from storage
    await removeStorage([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_EMAIL]);

    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    const result = await getStorage(STORAGE_KEYS.AUTH_TOKEN);
    const token = result[STORAGE_KEYS.AUTH_TOKEN];

    if (!token) {
      return false;
    }

    // Try to get token silently to verify it's still valid
    const validToken = await getAuthToken(false);
    return !!validToken;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

/**
 * Get current user's email from token
 * @param {string} token - OAuth token
 * @returns {Promise<string>} User email
 */
export async function getUserEmail(token) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return data.email;
  } catch (error) {
    console.error('Failed to get user email:', error);
    throw error;
  }
}

/**
 * Get valid OAuth token (refresh if needed)
 * @returns {Promise<string>} Valid OAuth token
 */
export async function getValidToken() {
  try {
    // Try to get token silently first
    let token = await getAuthToken(false);

    if (!token) {
      // If silent auth fails, try interactive
      token = await getAuthToken(true);
      await setStorage({ [STORAGE_KEYS.AUTH_TOKEN]: token });
    }

    return token;
  } catch (error) {
    console.error('Failed to get valid token:', error);
    throw new Error('Please sign in to continue');
  }
}

/**
 * Refresh OAuth token
 * @returns {Promise<string>} New OAuth token
 */
export async function refreshToken() {
  try {
    // Get current token
    const result = await getStorage(STORAGE_KEYS.AUTH_TOKEN);
    const oldToken = result[STORAGE_KEYS.AUTH_TOKEN];

    if (oldToken) {
      // Remove old token
      await removeCachedToken(oldToken);
    }

    // Get new token
    const newToken = await getAuthToken(true);
    await setStorage({ [STORAGE_KEYS.AUTH_TOKEN]: newToken });

    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}
