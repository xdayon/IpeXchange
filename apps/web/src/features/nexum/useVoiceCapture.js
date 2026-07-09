import { useRef, useState, useCallback } from 'react';
import { useRecorder } from './useRecorder.js';
import { transcribeAudio } from '../../api/copilot.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';

const LOCK_DY = 56;
const CANCEL_DX = 72;
const TAP_MS = 500;
const TOOLTIP_MS = 1500;
const CANCEL_ANIM_MS = 200;
const LOCK_CLICK_GUARD_MS = 400;

const DESKTOP_PLATFORMS = ['tdesktop', 'macos', 'weba', 'web'];

const micErrorMessage = (kind) => {
  const platform = window?.Telegram?.WebApp?.platform;
  if (DESKTOP_PLATFORMS.includes(platform)) {
    return 'Voice is not available in this Telegram client. Open ipexchange.xyz in a browser, or type instead.';
  }
  switch (kind) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Microphone blocked. Allow the mic for this site in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone found on this device.';
    case 'NotReadableError':
      return 'The microphone is busy in another app. Close it and try again.';
    case 'insecure':
      return 'Voice needs a secure (https) connection.';
    default:
      return 'Microphone unavailable. Check your browser permissions.';
  }
};

// Drives the WhatsApp-style hold-to-record gesture: press to record, drag up
// to lock, drag left to cancel, release to send. Wraps useRecorder with the
// pointer-gesture state machine so MicButton/RecorderBar stay pure render.
export function useVoiceCapture({ send, setOrbState }) {
  const recorder = useRecorder();
  const { haptic } = useTelegram();
  const [locked, setLocked] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [micError, setMicError] = useState(null);

  const startPos = useRef({ x: 0, y: 0, t: 0 });
  const settledRef = useRef(false); // true once locked or canceled, ignore further gesture math
  const pointerDownRef = useRef(false);
  const lockedAtRef = useRef(0);

  const finishAndSend = useCallback(async () => {
    setOrbState('thinking');
    const blob = await recorder.stop();
    if (!blob) { setOrbState('idle'); return; }
    try {
      const text = await transcribeAudio(blob);
      if (text) send(text);
      else setOrbState('idle');
    } catch {
      setMicError('Could not transcribe the audio. Try again or type instead.');
      setOrbState('idle');
    }
  }, [recorder, send, setOrbState]);

  const showTooltip = useCallback(() => {
    setTooltip(true);
    setTimeout(() => setTooltip(false), TOOLTIP_MS);
  }, []);

  const doCancel = useCallback(() => {
    setCanceling(true);
    setTimeout(() => {
      recorder.cancel();
      setLocked(false);
      setCanceling(false);
      setOrbState('idle');
    }, CANCEL_ANIM_MS);
  }, [recorder, setOrbState]);

  const onPointerDown = useCallback(async (e) => {
    if (recorder.recording) return;
    setMicError(null);
    pointerDownRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    settledRef.current = false;
    setLocked(false);
    setCanceling(false);
    const ok = await recorder.start();
    if (ok) {
      // The permission prompt can outlive the touch/click; if the finger is
      // already gone (and the gesture never locked) the recording is orphaned.
      if (!pointerDownRef.current && !settledRef.current) {
        recorder.cancel();
        setOrbState('idle');
        showTooltip();
        return;
      }
      haptic('light');
      setOrbState('listening');
    } else {
      setMicError(micErrorMessage(recorder.lastError.current));
    }
  }, [recorder, haptic, setOrbState, showTooltip]);

  const onPointerMove = useCallback((e) => {
    if (!recorder.recording || settledRef.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = startPos.current.y - e.clientY;
    if (dy >= LOCK_DY) {
      settledRef.current = true;
      lockedAtRef.current = Date.now();
      setLocked(true);
      haptic('medium');
    } else if (dx <= -CANCEL_DX) {
      settledRef.current = true;
      doCancel();
    }
  }, [recorder.recording, haptic, doCancel]);

  const onPointerUp = useCallback(() => {
    pointerDownRef.current = false;
    if (!recorder.recording || locked || canceling) return;
    if (settledRef.current) return; // already canceled via drag
    const held = Date.now() - startPos.current.t;
    if (held < TAP_MS) {
      recorder.cancel();
      setOrbState('idle');
      showTooltip();
    } else {
      finishAndSend();
    }
  }, [recorder, locked, canceling, finishAndSend, showTooltip, setOrbState]);

  const onTrashClick = useCallback(() => {
    doCancel();
  }, [doCancel]);

  const onSendClick = useCallback(() => {
    // A synthesized click fires right after the lock-drag pointerup; ignore
    // it so lifting the finger over the button doesn't instantly send.
    if (Date.now() - lockedAtRef.current < LOCK_CLICK_GUARD_MS) return;
    setLocked(false);
    finishAndSend();
  }, [finishAndSend]);

  return {
    supported: recorder.supported,
    recording: recorder.recording,
    elapsed: recorder.elapsed,
    analyser: recorder.analyser,
    locked,
    canceling,
    tooltip,
    micError,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTrashClick,
    onSendClick,
  };
}
