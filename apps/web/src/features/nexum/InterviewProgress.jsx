import { Check, Circle } from 'lucide-react';

const STEP_DEFS = [
  ['interests', 'Interest'],
  ['offers', 'Offer'],
  ['detailed', 'Match details'],
];

export default function InterviewProgress({ progress, ready }) {
  return (
    <div className="nexum-progress" aria-label="Interview progress">
      <span className="nexum-progress__label">Building your market profile</span>
      <div className="nexum-progress__steps">
        {STEP_DEFS.map(([key, label]) => {
          const complete = progress[key] > 0 || (key === 'detailed' && ready);
          return (
            <span key={key} className={complete ? 'is-complete' : ''}>
              {complete ? <Check size={12} /> : <Circle size={10} />}
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
