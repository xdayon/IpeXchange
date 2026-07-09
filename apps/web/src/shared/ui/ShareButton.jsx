import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ url }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // User cancelled the native share sheet — nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
        background: 'transparent', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-full)', color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
