import { apiFetch } from './index.js';

export async function interviewTurn(messages) {
  return apiFetch('/copilot/interview', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  }).then((d) => d.reply);
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

export async function createDrafts(rawText) {
  return apiFetch('/copilot/drafts', {
    method: 'POST',
    body: JSON.stringify({ raw_text: rawText }),
  });
}

export async function publishDrafts(draftId, drafts) {
  return apiFetch(`/copilot/drafts/${draftId}/publish`, {
    method: 'POST',
    body: JSON.stringify({ drafts }),
  }).then((d) => d.intents);
}
