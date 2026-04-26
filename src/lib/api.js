// API Library for IpeXchange

let API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) {
  API_URL += '/api';
}

export async function sendChatMessage(sessionId, message, isAudio = false, audioBase64 = null, mimeType = null) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, isAudio, audioBase64, mimeType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('sendChatMessage error:', error);
    // Fallback for demo if API is offline
    return {
      text: '⚡ Core is currently offline. Please try again later.',
      cta: null,
      rateLimited: false,
    };
  }
}

export async function fetchSessionHistory(sessionId) {
  try {
    const response = await fetch(`${API_URL}/history/${sessionId}`);
    if (!response.ok) throw new Error('History fetch failed');
    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('fetchSessionHistory error:', error);
    return [];
  }
}

export async function fetchDiscoverItems() {
  try {
    const response = await fetch(`${API_URL}/discover`);
    if (!response.ok) throw new Error('Discover fetch failed');
    return await response.json();
  } catch (error) {
    console.error('fetchDiscoverItems error:', error);
    return { listings: [], trending: [], hotIntents: [] };
  }
}

export async function pingHealth() {
  try {
    await fetch(`${API_URL}/health`);
  } catch (error) {
    // Ignore, just a keepalive ping
  }
}
