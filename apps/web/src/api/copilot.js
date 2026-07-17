import { apiFetch } from './index.js';

// Sends one interview turn and receives Nexum's reply plus verified state.
export async function interviewTurn(sessionId, messages) {
  return apiFetch('/copilot/interview', {
    method: 'POST', body: JSON.stringify({ session_id: sessionId, messages }),
  });
}

export async function transcribeAudio(blob) {
  // Whisper infers the container from the file extension; match the blob type.
  const ext = blob.type.includes('mp4') ? 'mp4'
    : blob.type.includes('ogg') ? 'ogg'
    : blob.type.includes('mpeg') ? 'mp3'
    : 'webm';
  const form = new FormData();
  form.append('audio', blob, `voice.${ext}`);
  return apiFetch('/copilot/transcribe', { method: 'POST', body: form }).then((d) => d.text);
}

export async function createDrafts(messages, sessionId) {
  return apiFetch('/copilot/drafts', {
    method: 'POST',
    body: JSON.stringify({ messages, session_id: sessionId }),
  });
}

export async function trackNexumEvent(sessionId, event, properties = {}) {
  return apiFetch('/copilot/events', {
    method: 'POST', body: JSON.stringify({ session_id: sessionId, event, properties }),
  });
}

export async function setNexumMemory(enabled) {
  return apiFetch('/copilot/memory', {
    method: 'POST', body: JSON.stringify({ enabled }),
  });
}

export async function publishDrafts(draftId, drafts) {
  await apiFetch(`/copilot/drafts/${draftId}`, {
    method: 'PUT',
    body: JSON.stringify({ drafts }),
  });
  return apiFetch(`/copilot/drafts/${draftId}/publish`, {
    method: 'POST',
  });
}
