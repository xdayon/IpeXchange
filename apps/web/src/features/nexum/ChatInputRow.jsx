import { SendHorizontal, Trash2 } from 'lucide-react';
import MicButton from './MicButton.jsx';
import RecorderBar from './RecorderBar.jsx';

export default function ChatInputRow({
  input, setInput, submitText, busy, onFocus,
  voice,
}) {
  const { supported, recording, locked, canceling, elapsed, analyser, tooltip, onPointerDown, onPointerMove, onPointerUp, onTrashClick, onSendClick } = voice;

  return (
    <>
      <div className="nexum-input-row" style={{ position: 'relative' }}>
        {recording && locked && (
          <button className="voice-trash pressable" onClick={onTrashClick} title="Discard recording">
            <Trash2 size={17} />
          </button>
        )}

        {recording ? (
          <RecorderBar elapsed={elapsed} analyser={analyser} locked={locked} canceling={canceling} />
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitText()}
            onFocus={onFocus}
            placeholder="Answer Nexum..."
            disabled={busy}
            className="nexum-text-input"
          />
        )}

        {supported && (
          <MicButton
            recording={recording}
            locked={locked}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onSendClick={onSendClick}
          />
        )}

        {!recording && (
          <button onClick={submitText} disabled={!input.trim() || busy} className="mic-btn pressable" title="Send">
            <SendHorizontal size={19} />
          </button>
        )}

        {tooltip && <span className="voice-tooltip">Hold to record</span>}
      </div>
    </>
  );
}
