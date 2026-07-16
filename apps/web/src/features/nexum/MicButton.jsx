import { Mic, SendHorizontal } from 'lucide-react';

// Pure presentational hold-to-record button. All gesture logic lives in
// useVoiceCapture; this just wires pointer events and swaps its icon.
export default function MicButton({
  recording, locked, disabled, onPointerDown, onPointerMove, onPointerUp, onSendClick,
}) {
  const Icon = locked ? SendHorizontal : Mic;

  return (
    <button
      className={`mic-btn pressable${recording ? ' recording' : ''}${locked ? ' locked' : ''}`}
      disabled={disabled}
      style={{ touchAction: 'none' }}
      onPointerDown={locked || disabled ? undefined : onPointerDown}
      onPointerMove={locked || disabled ? undefined : onPointerMove}
      onPointerUp={locked || disabled ? undefined : onPointerUp}
      onPointerCancel={locked || disabled ? undefined : onPointerUp}
      onClick={locked && !disabled ? onSendClick : undefined}
      title={locked ? 'Send voice message' : recording ? 'Recording... release to send' : 'Hold to record'}
    >
      <Icon size={locked ? 19 : 20} />
    </button>
  );
}
