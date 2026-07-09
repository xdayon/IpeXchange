import { Mic, SendHorizontal } from 'lucide-react';

// Pure presentational hold-to-record button. All gesture logic lives in
// useVoiceCapture; this just wires pointer events and swaps its icon.
export default function MicButton({ recording, locked, onPointerDown, onPointerMove, onPointerUp, onSendClick }) {
  const Icon = locked ? SendHorizontal : Mic;

  return (
    <button
      className={`mic-btn pressable${recording ? ' recording' : ''}${locked ? ' locked' : ''}`}
      style={{ touchAction: 'none' }}
      onPointerDown={locked ? undefined : onPointerDown}
      onPointerMove={locked ? undefined : onPointerMove}
      onPointerUp={locked ? undefined : onPointerUp}
      onPointerCancel={locked ? undefined : onPointerUp}
      onClick={locked ? onSendClick : undefined}
      title={locked ? 'Send voice message' : recording ? 'Recording... release to send' : 'Hold to record'}
    >
      <Icon size={locked ? 19 : 20} />
    </button>
  );
}
