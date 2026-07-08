import { useState, useRef, useCallback } from 'react';

// Records microphone audio as webm/opus for Whisper transcription.
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [supported] = useState(() => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder));
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const errorRef = useRef(null);

  const start = useCallback(async () => {
    errorRef.current = null;
    if (!supported || recorderRef.current) {
      errorRef.current = 'unsupported';
      return false;
    }
    if (!window.isSecureContext) {
      errorRef.current = 'insecure';
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari/iOS has no webm support and records mp4/aac instead.
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
        .find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      return true;
    } catch (err) {
      errorRef.current = err?.name || 'unknown';
      return false;
    }
  }, [supported]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) return resolve(null);
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        resolve(blob.size > 200 ? blob : null);
      };
      recorder.stop();
    });
  }, []);

  return { recording, supported, start, stop, lastError: errorRef };
}
