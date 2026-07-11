import { Check } from 'lucide-react';

export default function InterviewProgress({ progress, ready }) {
  const total = progress.interests + progress.offers;
  if (!total) return null;

  return (
    <div className={`nexum-progress ${ready ? 'is-ready' : ''}`} aria-live="polite">
      <Check size={12} />
      <span>{ready ? 'Ready to review' : `${total} intent${total === 1 ? '' : 's'} understood`}</span>
    </div>
  );
}
