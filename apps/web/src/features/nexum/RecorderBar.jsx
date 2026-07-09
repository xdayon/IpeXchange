import { ChevronUp } from 'lucide-react';
import Waveform from './Waveform.jsx';

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function RecorderBar({ elapsed, analyser, locked, canceling }) {
  return (
    <div className={`voice-recorder-bar${canceling ? ' voice-slide-out' : ''}`}>
      <span className="voice-dot" aria-hidden="true" />
      <span className="voice-timer">{formatTime(elapsed)}</span>
      <Waveform analyser={analyser} />
      {!locked && (
        <span className="voice-hint">
          <ChevronUp size={12} className="voice-hint-chevron" /> Slide up to lock
        </span>
      )}
    </div>
  );
}
