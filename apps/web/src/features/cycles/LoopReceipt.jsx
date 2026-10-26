import { ShieldCheck, ExternalLink } from 'lucide-react';
import { useLoopReceipt } from './useLoopReceipt.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';

const shortKey = (key) => (key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '');

// Proof that the loop happened: a signed, pseudonymous receipt, later
// anchored on Solana inside a batch Merkle root.
export default function LoopReceipt({ cycleId, completed }) {
  const receipt = useLoopReceipt(cycleId, completed);
  const { openLink } = useTelegram();
  if (!receipt?.digest) return null;
  const anchored = receipt.batch?.status === 'anchored' && receipt.batch.explorer_url;

  return (
    <section className="loop-receipt" aria-label="Loop receipt">
      <h3><ShieldCheck size={16} aria-hidden="true" /> Verifiable receipt</h3>
      <p>
        {receipt.verified_signature
          ? `Signed by IpeXchange (${shortKey(receipt.signer)}).`
          : 'Recorded. The signature is added when signing is enabled.'}
        {' '}Members and items appear only as pseudonyms.
      </p>
      {anchored ? (
        <a href={receipt.batch.explorer_url} target="_blank" rel="noopener noreferrer"
          onClick={(event) => { event.preventDefault(); openLink(receipt.batch.explorer_url); }}>
          Anchored on Solana <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : (
        receipt.verified_signature && <p className="loop-receipt-pending">Anchoring on Solana is pending.</p>
      )}
    </section>
  );
}
