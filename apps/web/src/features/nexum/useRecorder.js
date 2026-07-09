import { useState, useRef, useCallback, useEffect } from 'react';

// Records microphone audio as webm/opus for Whisper transcription.
// Also exposes a live AnalyserNode for waveform rendering and an elapsed
// timer, both used by the WhatsApp-style hold-to-record UI.
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState(null);
  const [supported] = useState(() => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder));
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const errorRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const teardownAudio = useCallback(() => {
    clearTimer();
    setElapsed(0);
    setAnalyser(null);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => () => teardownAudio(), [teardownAudio]);

  const start = useCallback(async () => {
    errorRef.current = null;
    if (recorderRef.current) return true;
    if (!supported) {
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

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          await ctx.resume();
          const source = ctx.createMediaStreamSource(stream);
          const node = ctx.createAnalyser();
          node.fftSize = 256;
          source.connect(node);
          audioCtxRef.current = ctx;
          setAnalyser(node);
        }
      } catch {
        audioCtxRef.current = null;
        setAnalyser(null);
      }

      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
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
        teardownAudio();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        resolve(blob.size > 200 ? blob : null);
      };
      recorder.stop();
    });
  }, [teardownAudio]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.ondataavailable = null;
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
    };
    recorder.stop();
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    teardownAudio();
  }, [teardownAudio]);

  return { recording, elapsed, analyser, supported, start, stop, cancel, lastError: errorRef };
}
